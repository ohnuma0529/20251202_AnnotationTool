import os

class Settings:
    VIDEO_DIR: str = os.getenv("VIDEO_DIR", "/home/ohnuma/Marine/onlyvideo/")
    FRAME_CACHE_DIR: str = os.getenv("FRAME_CACHE_DIR", "/mnt/datasets/AnnotationTool/VideoFrame")
    ANNOTATION_DIR: str = os.getenv("ANNOTATION_DIR", "/mnt/datasets/AnnotationTool/Annotations")
    TRANSCRIPTION_DIR: str = os.getenv("TRANSCRIPTION_DIR", "/mnt/datasets/AnnotationTool/Transcriptions")
    # Updated model path as requested
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "../weights/detect/all.pt")
    YOLO_SEG_MODEL_PATH: str = os.getenv("YOLO_SEG_MODEL_PATH", "../weights/seg/seg.pt")
    SAM2_MODEL_PATH: str = os.getenv("SAM2_MODEL_PATH", "../weights/sam2.1_l.pt")

settings = Settings()
