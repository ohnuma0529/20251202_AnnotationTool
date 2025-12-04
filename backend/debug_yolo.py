from ultralytics import YOLO
import cv2
import os
import sys

# Path from config
MODEL_PATH = "../weights/detect/all.pt"
VIDEO_PATH = "/home/ohnuma/Marine/onlyvideo/GX010103.MP4"

def test_yolo():
    print(f"Testing YOLO model from {MODEL_PATH}")
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file not found at {MODEL_PATH}")
        return

    try:
        model = YOLO(MODEL_PATH)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    print(f"Testing inference on {VIDEO_PATH}")
    if not os.path.exists(VIDEO_PATH):
        print(f"Error: Video file not found at {VIDEO_PATH}")
        return

    cap = cv2.VideoCapture(VIDEO_PATH)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        print("Error: Could not read frame from video.")
        return

    try:
        results = model.predict(frame, conf=0.5, verbose=True)
        print(f"Inference successful. Detected {len(results[0].boxes)} boxes.")
        for box in results[0].boxes:
            print(f"Box: {box.xyxy}, Conf: {box.conf}")
    except Exception as e:
        print(f"Error during inference: {e}")

if __name__ == "__main__":
    test_yolo()
