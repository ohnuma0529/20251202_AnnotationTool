import os
import json
import whisper
import torch
from config import settings

# Global model cache
_whisper_model = None
_current_model_name = None

def get_whisper_model(model_name="large"):
    global _whisper_model, _current_model_name
    
    if _whisper_model is not None and _current_model_name == model_name:
        return _whisper_model
        
    print(f"Loading Whisper model ({model_name})...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    _whisper_model = whisper.load_model(model_name, device=device)
    _current_model_name = model_name
    print(f"Whisper model ({model_name}) loaded on {device}")
    return _whisper_model

def transcribe_video(video_path: str, video_name: str, model_name: str = "large", force: bool = False):
    """
    Transcribe video using Whisper.
    Returns list of segments: {text, start, end}
    Saves result to JSON.
    """
    save_dir = os.path.join(settings.TRANSCRIPTION_DIR, video_name)
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, "transcription.json")
    
    # Check if exists
    if not force and os.path.exists(save_path):
        print(f"Transcription already exists for {video_name}")
        try:
            with open(save_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading existing transcription: {e}. Re-transcribing.")
            # Fall through to re-transcribe
    
    print(f"Transcribing {video_path} with model {model_name}...")
    model = get_whisper_model(model_name)
    
    # Transcribe
    # language='ja' for Japanese
    result = model.transcribe(video_path, language='ja')
    
    segments = []
    for seg in result['segments']:
        segments.append({
            "start": seg['start'],
            "end": seg['end'],
            "text": seg['text']
        })
        
    # Save
    with open(save_path, 'w', encoding='utf-8') as f:
        json.dump(segments, f, ensure_ascii=False, indent=2)
        
    print(f"Transcription saved to {save_path}")
    return segments
