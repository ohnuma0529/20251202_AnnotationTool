from ultralytics import YOLO, SAM
import os

# Paths
yolo_seg_path = "../weights/seg/seg.pt"
sam_path = "../weights/sam2.1_l.pt"

print(f"Checking YOLO Seg: {yolo_seg_path}")
if os.path.exists(yolo_seg_path):
    try:
        model = YOLO(yolo_seg_path)
        print("YOLO Seg loaded successfully")
    except Exception as e:
        print(f"Failed to load YOLO Seg: {e}")
else:
    print("YOLO Seg weights not found")

print(f"Checking SAM: {sam_path}")
if os.path.exists(sam_path):
    try:
        # Try loading via YOLO class first as it supports SAM sometimes, or SAM class
        # Ultralytics supports SAM models via SAM class
        model = SAM(sam_path)
        print("SAM loaded successfully via Ultralytics")
    except Exception as e:
        print(f"Failed to load SAM via Ultralytics: {e}")
else:
    print("SAM weights not found")
