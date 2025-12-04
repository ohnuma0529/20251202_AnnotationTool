import cv2
import os
import numpy as np

def is_blurry(image, threshold=100.0) -> bool:
    """Check if image is blurry using Laplacian variance."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return variance < threshold

def is_overexposed(image, threshold=220.0) -> bool:
    """Check if image is overexposed using mean brightness."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    return mean_brightness > threshold

from api.state import progress_store

def extract_frames(video_path: str, output_dir: str, rate: float = 1.0, limit: int = 0, model=None, video_name: str = None) -> list:
    """
    Extract frames from a video at a given rate, filtering with YOLO and quality checks.
    """
    print(f"Extracting frames from {video_path} to {output_dir} (rate={rate})")
    
    if video_name:
        progress_store[video_name] = 0
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Check cache first
    cached_files = sorted([os.path.join(output_dir, f) for f in os.listdir(output_dir) if f.endswith('.jpg')])
    if cached_files:
        print(f"Found {len(cached_files)} cached frames.")
        if video_name:
            progress_store[video_name] = 100
        return cached_files

    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
        
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if fps <= 0:
        fps = 30.0 # Fallback
        
    frame_interval = int(fps * rate)
    if frame_interval == 0:
        frame_interval = 1
        
    extracted_frames = []
    saved_count = 0
    
    # Iterate by jumping
    current_frame = 0
    while True:
        if video_name and total_frames > 0:
            progress = int((current_frame / total_frames) * 100)
            progress_store[video_name] = progress

        if current_frame >= total_frames:
            break
            
        # Seek and read
        cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
        ret, frame = cap.read()
        if not ret:
            break

        # Quality Checks
        if is_blurry(frame):
            # print(f"Skipped frame {current_frame}: Blurry") # Too noisy
            current_frame += frame_interval
            continue
            
        if is_overexposed(frame):
            # print(f"Skipped frame {current_frame}: Overexposed") # Too noisy
            current_frame += frame_interval
            continue

        # YOLO Filtering
        has_fish = False
        if model:
            try:
                # Run inference
                # verbose=False to reduce noise
                # conf=0.5 as requested
                results = model.predict(frame, conf=0.5, verbose=False)
                # Check if any boxes detected
                if len(results) > 0 and len(results[0].boxes) > 0:
                    has_fish = True
            except Exception as e:
                print(f"Warning: YOLO inference failed on frame {current_frame}: {e}")
                has_fish = False
        else:
            # If no model provided, save all (fallback)
            has_fish = True

        if has_fish:
            timestamp = current_frame / fps
            minutes = int(timestamp // 60)
            seconds = int(timestamp % 60)
            filename = f"{os.path.splitext(os.path.basename(video_path))[0]}_T{minutes:02d}M{seconds:02d}S_{current_frame}.jpg"
            output_path = os.path.join(output_dir, filename)
            
            cv2.imwrite(output_path, frame)
            extracted_frames.append(output_path)
            saved_count += 1
            print(f"Saved frame {saved_count}: {output_path} (Fish detected)")
            
            if limit > 0 and saved_count >= limit:
                break
        
        current_frame += frame_interval
        
    cap.release()
    if video_name:
        progress_store[video_name] = 100
        
    print(f"Extraction complete. Saved {len(extracted_frames)} frames.")
    return extracted_frames
