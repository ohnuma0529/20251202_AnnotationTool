import os
import sys
import glob
from config import settings
from core.video_processing import extract_frames
from core.transcription import transcribe_video

def preprocess_videos():
    video_dir = settings.VIDEO_DIR
    frames_dir = settings.FRAME_CACHE_DIR
    transcription_dir = settings.TRANSCRIPTION_DIR

    print(f"Searching for videos in: {video_dir}")

    # Get list of videos
    video_extensions = ['*.mp4', '*.avi', '*.mov', '*.mkv', '*.MP4', '*.AVI', '*.MOV', '*.MKV']
    video_paths = []
    for ext in video_extensions:
        video_paths.extend(glob.glob(os.path.join(video_dir, ext)))
    
    video_paths.sort()
    
    print(f"Found {len(video_paths)} videos.")

    for video_path in video_paths:
        video_filename = os.path.basename(video_path)
        video_name = os.path.splitext(video_filename)[0]
        
        print(f"\nProcessing: {video_filename}")

        # 1. Frame Extraction
        video_frames_dir = os.path.join(frames_dir, video_name)
        if os.path.exists(video_frames_dir) and len(os.listdir(video_frames_dir)) > 0:
            print(f"  [Skip] Frames already extracted for {video_name}")
        else:
            print(f"  [Action] Extracting frames for {video_name}...")
            try:
                # Note: We are not using YOLO filtering here to speed up/simplify, 
                # or should we? The user said "extract frames", usually implies the standard extraction.
                # The App uses extract_frames which has optional model.
                # If we want to filter by fish, we need to load the model.
                # However, loading model takes time and GPU memory.
                # The user said "make it so loading is minimal".
                # If we pre-extract, we should probably do the standard extraction (1fps).
                # The current extract_frames implementation filters by quality (blur/exposure).
                # It accepts a model for YOLO filtering.
                # If we pass model=None, it saves all frames (passing quality check).
                # Let's stick to model=None for now to be safe and general, 
                # unless the user specifically wants fish-only frames.
                # The user said "check videos... extract frames...".
                # Given the tool is for fish annotation, maybe they want fish only?
                # But the prompt says "make it so loading is minimal", implying the goal is to avoid waiting for extraction when selecting a video.
                # Standard extraction is fine.
                extract_frames(video_path, video_frames_dir, rate=1.0, video_name=video_name)
            except Exception as e:
                print(f"  [Error] Frame extraction failed: {e}")

        # 2. Transcription
        print(f"  [Action] Transcribing {video_name} (Model: large)...")
        try:
            transcribe_video(video_path, video_name, model_name="large", force=True)
        except Exception as e:
            print(f"  [Error] Transcription failed: {e}")

    print("\nAll videos processed.")

if __name__ == "__main__":
    preprocess_videos()
