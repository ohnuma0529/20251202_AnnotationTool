from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from typing import List
from config import settings
from core.video_processing import extract_frames
import cv2
import numpy as np
import json
import time

def cleanup_old_files(directory: str, max_age_seconds: int = 3600):
    """Delete files in directory older than max_age_seconds."""
    if not os.path.exists(directory):
        return
        
    now = time.time()
    for f in os.listdir(directory):
        file_path = os.path.join(directory, f)
        if os.path.isfile(file_path):
            try:
                if now - os.path.getmtime(file_path) > max_age_seconds:
                    os.remove(file_path)
            except Exception as e:
                print(f"Error deleting old file {file_path}: {e}")

router = APIRouter()

class VideoInfo(BaseModel):
    filename: str
    path: str

@router.get("/videos", response_model=List[VideoInfo])
def list_videos():
    """List all MP4 videos in the configured directory."""
    video_dir = settings.VIDEO_DIR
    if not os.path.exists(video_dir):
        print(f"Warning: Video directory {video_dir} does not exist.")
        return []
    
    videos = []
    try:
        for f in os.listdir(video_dir):
            if f.lower().endswith(".mp4"):
                videos.append(VideoInfo(filename=f, path=os.path.join(video_dir, f)))
        
        videos.sort(key=lambda x: (x.filename != "GX010103.MP4", x.filename))
        return videos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing videos: {str(e)}")

from core.ai_models import YOLOModel, YOLOSegModel, SAM2Model
from ultralytics import YOLO

# Initialize models globally
yolo_model = None
yolo_seg_model = None
sam_model = None

try:
    print(f"Loading YOLO model from {settings.YOLO_MODEL_PATH}...")
    yolo_model = YOLO(settings.YOLO_MODEL_PATH)
    print("YOLO model loaded.")
except Exception as e:
    print(f"Failed to initialize YOLO model: {e}")

try:
    print(f"Loading YOLO Seg model from {settings.YOLO_SEG_MODEL_PATH}...")
    yolo_seg_model = YOLOSegModel(settings.YOLO_SEG_MODEL_PATH)
    print("YOLO Seg model loaded.")
except Exception as e:
    print(f"Failed to initialize YOLO Seg model: {e}")

try:
    print(f"Loading SAM model from {settings.SAM2_MODEL_PATH}...")
    sam_model = SAM2Model(settings.SAM2_MODEL_PATH)
    print("SAM model loaded.")
except Exception as e:
    print(f"Failed to initialize SAM model: {e}")

from api.state import progress_store

@router.get("/progress/{video_name}")
def get_progress(video_name: str):
    """Get processing progress for a video."""
    return {"progress": progress_store.get(video_name, 0)}

@router.get("/frames")
def get_frames_endpoint(video_path: str):
    """Extract frames from video and return their URLs."""
    if not os.path.exists(video_path):
         raise HTTPException(status_code=404, detail=f"Video not found: {video_path}")
    
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    # Use the configured cache directory
    output_dir = os.path.join(settings.FRAME_CACHE_DIR, video_name)
    
    try:
        # Enforce rate=1.0 as per requirement
        # Pass the loaded model for filtering
        # Pass video_name for progress tracking
        frames = extract_frames(video_path, output_dir, rate=1.0, video_name=video_name)
        
        # Update web paths to point to /static/frames
        web_paths = [f"/static/frames/{video_name}/{os.path.basename(f)}" for f in frames]
        
        # Sort frames by timestamp/index to ensure correct order for slider
        web_paths.sort(key=lambda x: int(x.split('_')[-1].split('.')[0]))
        
        return {"frames": web_paths, "count": len(frames)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ProcessRequest(BaseModel):
    frame_url: str # /static/frames/...
    bbox: List[float] # [x, y, w, h] normalized (0-1)
    conf_threshold: float = 0.25
    size_threshold: float = 0.0 # Ratio of max(w,h) to min(frame_w, frame_h)
    auto_segmentation: bool = False
    seg_model: str = "YOLO" # "YOLO" or "SAM"

@router.post("/process")
def process_region(request: ProcessRequest):
    """Run AI on the selected region."""
    if yolo_model is None:
        raise HTTPException(status_code=503, detail="AI model not initialized")

    # Cleanup old crops (older than 1 hour)
    cleanup_old_files("data/crops", max_age_seconds=3600)

    # Resolve frame_url to local path
    # URL: /static/frames/VideoName/File.jpg -> Local: settings.FRAME_CACHE_DIR/VideoName/File.jpg
    if request.frame_url.startswith("/static/frames/"):
        rel_path = request.frame_url.replace("/static/frames/", "")
        local_path = os.path.join(settings.FRAME_CACHE_DIR, rel_path)
    else:
        # Fallback or error
        raise HTTPException(status_code=400, detail="Invalid frame URL format")
    
    if not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail=f"Frame not found: {local_path}")
    
    # Read image
    image = cv2.imread(local_path)
    if image is None:
        raise HTTPException(status_code=500, detail="Failed to read image")
        
    img_h, img_w = image.shape[:2]
    nx, ny, nw, nh = request.bbox
    
    # Convert normalized to pixel coords
    x = int(nx * img_w)
    y = int(ny * img_h)
    w = int(nw * img_w)
    h = int(nh * img_h)
    
    # Clip to image bounds
    x = max(0, x)
    y = max(0, y)
    w = min(img_w - x, w)
    h = min(img_h - y, h)
    
    if w <= 0 or h <= 0:
        raise HTTPException(status_code=400, detail="Invalid bbox dimensions")

    # Crop
    crop = image[y:y+h, x:x+w]
    
    # Detect fish in crop
    try:
        # Run inference
        results = yolo_model.predict(crop, conf=request.conf_threshold, verbose=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
    
    # Generate individual fish crops
    fish_crops = []
    crop_name_base = os.path.splitext(os.path.basename(local_path))[0]
    
    # Ensure data/crops exists
    crops_dir = "data/crops"
    os.makedirs(crops_dir, exist_ok=True)
    
    min_frame_dim = min(img_w, img_h)

    for result in results:
        for i, box in enumerate(result.boxes):
            conf = float(box.conf[0])
            if conf < request.conf_threshold:
                continue

            fx, fy, fx2, fy2 = box.xyxy[0].cpu().numpy()
            fw = fx2 - fx
            fh = fy2 - fy
            
            # Size Threshold Check
            if max(fw, fh) < request.size_threshold * min_frame_dim:
                continue

            # Expand 1.1x
            center_x = fx + fw / 2
            center_y = fy + fh / 2
            new_w = fw * 1.1
            new_h = fh * 1.1
            
            fx_new = int(center_x - new_w / 2)
            fy_new = int(center_y - new_h / 2)
            fw_new = int(new_w)
            fh_new = int(new_h)
            
            # Clip to CROP boundaries (since detection is on the crop)
            fx_new = max(0, fx_new)
            fy_new = max(0, fy_new)
            fw_new = min(crop.shape[1] - fx_new, fw_new)
            fh_new = min(crop.shape[0] - fy_new, fh_new)
            
            if fw_new <= 0 or fh_new <= 0:
                continue
                
            fish_crop_img = crop[fy_new:fy_new+fh_new, fx_new:fx_new+fw_new]
            
            # Background Removal Logic
            if request.auto_segmentation:
                mask = None
                if request.seg_model == "YOLO" and yolo_seg_model:
                    # YOLO Seg runs on the image and returns mask
                    # We can run it on the small fish crop for speed
                    mask = yolo_seg_model.segment(fish_crop_img)
                elif request.seg_model == "SAM" and sam_model:
                    # Use the original detection BBox relative to the crop as the prompt
                    # fx, fy are in the original 'crop' coordinates
                    # fx_new, fy_new are the top-left of 'fish_crop_img' in 'crop' coordinates
                    
                    prompt_x = max(0, int(fx - fx_new))
                    prompt_y = max(0, int(fy - fy_new))
                    prompt_w = int(fw)
                    prompt_h = int(fh)
                    
                    # Clip prompt to be within fish_crop_img dimensions
                    h_f, w_f = fish_crop_img.shape[:2]
                    prompt_w = min(w_f - prompt_x, prompt_w)
                    prompt_h = min(h_f - prompt_y, prompt_h)
                    
                    if prompt_w > 0 and prompt_h > 0:
                        mask = sam_model.segment(fish_crop_img, [prompt_x, prompt_y, prompt_w, prompt_h])
                    else:
                        print("Invalid SAM prompt dimensions, skipping segmentation")
                        mask = None
                
                if mask is not None:
                    # Apply mask: Black out background
                    # mask is 0 or 255
                    # Ensure mask is same size
                    if mask.shape[:2] != fish_crop_img.shape[:2]:
                         mask = cv2.resize(mask, (fish_crop_img.shape[1], fish_crop_img.shape[0]), interpolation=cv2.INTER_NEAREST)
                    
                    # Create 3-channel mask
                    mask_3ch = cv2.merge([mask, mask, mask])
                    
                    # Apply
                    fish_crop_img = cv2.bitwise_and(fish_crop_img, mask_3ch)

            # Letterbox resize to 640x640
            target_size = 640
            h_crop, w_crop = fish_crop_img.shape[:2]
            scale = target_size / max(h_crop, w_crop)
            new_w_resize = int(w_crop * scale)
            new_h_resize = int(h_crop * scale)
            
            resized = cv2.resize(fish_crop_img, (new_w_resize, new_h_resize))
            
            # Create black canvas
            canvas = np.zeros((target_size, target_size, 3), dtype=np.uint8)
            
            # Paste resized image at center
            x_offset = (target_size - new_w_resize) // 2
            y_offset = (target_size - new_h_resize) // 2
            canvas[y_offset:y_offset+new_h_resize, x_offset:x_offset+new_w_resize] = resized
            
            # Save temp crop
            import time
            timestamp = int(time.time() * 1000)
            temp_filename = f"{crop_name_base}_fish_{timestamp}_{i}.jpg"
            temp_path = os.path.join(crops_dir, temp_filename)
            cv2.imwrite(temp_path, canvas)
            
            fish_crops.append({
                "id": f"{timestamp}_{i}",
                "url": f"/data/crops/{temp_filename}",
                "bbox": [float(fx_new), float(fy_new), float(fw_new), float(fh_new)],
                "confidence": conf
            })
            
    # Sort by confidence descending
    fish_crops.sort(key=lambda x: x['confidence'], reverse=True)
        
    return {"fish": fish_crops}

class SaveRequest(BaseModel):
    video_name: str
    label: str
    crops: List[dict] # {url, frame_index, bbox}

@router.post("/save")
def save_annotations(request: SaveRequest):
    """Save selected crops to annotation directory."""
    print(f"Save Request: Video={request.video_name}, Label={request.label}, Crops={len(request.crops)}")
    
    if not request.label:
        raise HTTPException(status_code=400, detail="Label is required")
        
    # Create directory: /mnt/datasets/Marine/Annotations/<VideoName>/<Label>
    save_dir = os.path.join(settings.ANNOTATION_DIR, request.video_name, request.label)
    os.makedirs(save_dir, exist_ok=True)
    print(f"Saving to: {save_dir}")
    
    saved_count = 0
    for crop in request.crops:
        # Source path (from /data/crops/...)
        # crop['url'] is like /data/crops/filename.jpg
        # We need to map it to local path
        print(f"Processing crop: {crop['url']}")
        if crop['url'].startswith("/data/crops/"):
            filename = crop['url'].replace("/data/crops/", "")
            src_path = os.path.join("data/crops", filename)
        else:
            print(f"Skipping invalid URL: {crop['url']}")
            continue
            
        if not os.path.exists(src_path):
            print(f"Source file not found: {src_path}")
            continue
            
        # Dest filename: <VideoName>_frame<Index>_bbox<x>_<y>_<w>_<h>.jpg
        # bbox is [x, y, w, h] (pixels)
        bbox_str = "_".join(map(str, map(int, crop['bbox'])))
        frame_idx = crop.get('frame_index', 0)
        
        # Unique ID to prevent overwrite if multiple fish in same frame/bbox (unlikely but possible)
        # Use existing filename part or random
        import uuid
        uid = str(uuid.uuid4())[:8]
        
        # Overwrite logic: Check for existing files with same video, frame, and bbox in this label dir
        prefix = f"{request.video_name}_frame{frame_idx}_bbox{bbox_str}_"
        for f in os.listdir(save_dir):
            if f.startswith(prefix) and f.endswith(".jpg"):
                print(f"Overwriting existing annotation: {f}")
                try:
                    os.remove(os.path.join(save_dir, f))
                except Exception as e:
                    print(f"Failed to remove existing file {f}: {e}")

        dest_filename = f"{prefix}{uid}.jpg"
        dest_path = os.path.join(save_dir, dest_filename)
        
        # Copy file (it's already resized 640x640)
        import shutil
        try:
            shutil.copy2(src_path, dest_path)
            print(f"Saved: {dest_path}")
            saved_count += 1
        except Exception as e:
            print(f"Error copying file: {e}")
        
    return {"message": f"Saved {saved_count} annotations", "count": saved_count}

@router.get("/annotations")
def get_annotations(video_name: str, frame_index: int):
    """Get saved annotations for the current frame."""
    # Search /mnt/datasets/Marine/Annotations/<VideoName>/*/*.jpg
    # Filter by _frame<Index>_
    
    video_dir = os.path.join(settings.ANNOTATION_DIR, video_name)
    if not os.path.exists(video_dir):
        return {"annotations": []}
        
    annotations = []
    # Walk through all label directories
    for label in os.listdir(video_dir):
        label_dir = os.path.join(video_dir, label)
        if not os.path.isdir(label_dir):
            continue
            
        for f in os.listdir(label_dir):
            if f.lower().endswith(".jpg") and f"frame{frame_index}_" in f:
                # Found a match
                annotations.append({
                    "url": f"/static/annotations/{video_name}/{label}/{f}",
                    "label": label,
                    "filename": f
                })
                
    return {"annotations": annotations}
    return {"annotations": annotations}

class DeleteRequest(BaseModel):
    video_name: str
    annotations: List[dict] # {filename, label}

@router.post("/delete_annotations")
def delete_annotations(request: DeleteRequest):
    """Delete selected annotations."""
    print(f"Delete Request: Video={request.video_name}, Count={len(request.annotations)}")
    
    deleted_count = 0
    errors = []
    
    for ann in request.annotations:
        filename = ann.get('filename')
        label = ann.get('label')
        
        if not filename or not label:
            continue
            
        # Path: /mnt/datasets/Marine/Annotations/<VideoName>/<Label>/<Filename>
        file_path = os.path.join(settings.ANNOTATION_DIR, request.video_name, label, filename)
        
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Deleted: {file_path}")
                deleted_count += 1
            except Exception as e:
                print(f"Error deleting {file_path}: {e}")
                errors.append(str(e))
        else:
            print(f"File not found: {file_path}")
            
    if errors:
        return {"message": f"Deleted {deleted_count} annotations with errors", "count": deleted_count, "errors": errors}
        
    return {"message": f"Deleted {deleted_count} annotations", "count": deleted_count}


from fastapi.responses import FileResponse
from fastapi.background import BackgroundTasks
import shutil
import zipfile
import tempfile

class ExportRequest(BaseModel):
    video_names: List[str]

@router.post("/export")
def export_annotations_endpoint(request: ExportRequest, background_tasks: BackgroundTasks):
    """Export annotations for selected videos as a zip file."""
    if not request.video_names:
        raise HTTPException(status_code=400, detail="No videos selected")

    # Create a temporary directory for the zip
    temp_dir = tempfile.mkdtemp()
    zip_filename = f"annotations_export.zip"
    zip_path = os.path.join(temp_dir, zip_filename)

    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for video_name in request.video_names:
                # Annotation dir for this video
                video_ann_dir = os.path.join(settings.ANNOTATION_DIR, video_name)
                
                if os.path.exists(video_ann_dir):
                    # Add folder to zip
                    for root, dirs, files in os.walk(video_ann_dir):
                        for file in files:
                            file_path = os.path.join(root, file)
                            # Arcname should be relative to ANNOTATION_DIR so we get folder structure
                            # e.g. video_name/file.json
                            arcname = os.path.relpath(file_path, settings.ANNOTATION_DIR)
                            zipf.write(file_path, arcname)
        
        # Cleanup temp dir after response
        def cleanup():
            shutil.rmtree(temp_dir)
            
        background_tasks.add_task(cleanup)
        
        return FileResponse(zip_path, filename=zip_filename, media_type='application/zip')

    except Exception as e:
        shutil.rmtree(temp_dir)
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


from core.transcription import transcribe_video

class TranscriptionRequest(BaseModel):
    video_name: str
    model: str = "large"
    force: bool = False

@router.post("/transcribe")
def transcribe_endpoint(request: TranscriptionRequest):
    """Transcribe the selected video."""
    video_path = os.path.join(settings.VIDEO_DIR, request.video_name)
    if not os.path.exists(video_path):
        # Try adding .MP4 if missing
        if not video_path.lower().endswith(".mp4"):
             video_path += ".MP4"
        
        if not os.path.exists(video_path):
             raise HTTPException(status_code=404, detail=f"Video not found: {request.video_name}")

    try:
        segments = transcribe_video(video_path, request.video_name, model_name=request.model, force=request.force)
        return {"segments": segments}
    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transcription")
def get_transcription(video_name: str):
    """Get existing transcription for video."""
    save_path = os.path.join(settings.TRANSCRIPTION_DIR, video_name, "transcription.json")
    print(f"Checking transcription at: {save_path}")
    if os.path.exists(save_path):
        print("Transcription found.")
        with open(save_path, 'r', encoding='utf-8') as f:
            segments = json.load(f)
        return {"segments": segments}
    print("Transcription not found.")
    return {"segments": []}

