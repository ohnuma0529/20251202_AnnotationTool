import os
import cv2
import numpy as np
from ultralytics import YOLO

class YOLOModel:
    def __init__(self, weights_path: str):
        self.weights_path = weights_path
        print(f"Initializing YOLOModel with weights: {weights_path}")
        
        # Check if weights exist
        if not os.path.exists(weights_path):
            # Try relative to backend if not found
            if os.path.exists(os.path.join("..", weights_path)):
                self.weights_path = os.path.join("..", weights_path)
            else:
                raise FileNotFoundError(f"Weights not found at {weights_path}")
        
        try:
            self.model = YOLO(self.weights_path)
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
            raise

    def detect(self, image: np.ndarray):
        """
        Run detection on the image.
        Returns a list of bounding boxes [x, y, w, h].
        """
        if self.model is None:
            return []
            
        # Run inference
        results = self.model(image, verbose=False)
        
        bboxes = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # xywh format: x_center, y_center, width, height
                # xyxy format: x1, y1, x2, y2
                # We need x, y, w, h (top-left x, top-left y, width, height)
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                x = int(x1)
                y = int(y1)
                w = int(x2 - x1)
                h = int(y2 - y1)
                bboxes.append([x, y, w, h])
                
        return bboxes

class YOLOSegModel(YOLOModel):
    def __init__(self, weights_path: str):
        super().__init__(weights_path)
        print(f"Initializing YOLOSegModel with weights: {weights_path}")

    def segment(self, image: np.ndarray):
        """
        Run segmentation on the image.
        Returns a binary mask (uint8, 0 or 255) of the segmented object.
        If multiple objects, returns the mask of the one with highest confidence.
        """
        if self.model is None:
            return None
            
        results = self.model(image, verbose=False)
        
        if not results or not results[0].masks:
            return None
            
        # Get mask of the highest confidence detection
        # results[0].masks.data contains masks.
        # We assume the first one corresponds to the first box which is usually highest conf if sorted?
        # Ultralytics results are not strictly sorted by conf by default unless we ask?
        # Actually, let's look at boxes.conf to find max conf index.
        
        result = results[0]
        if result.boxes is None or len(result.boxes) == 0:
            return None
            
        # Find index of max confidence
        confidences = result.boxes.conf.cpu().numpy()
        max_idx = np.argmax(confidences)
        
        # Get corresponding mask
        # masks.data is (N, H, W)
        mask_tensor = result.masks.data[max_idx]
        mask = mask_tensor.cpu().numpy().astype(np.uint8) * 255
        
        # Resize mask to original image size if needed (masks might be smaller)
        if mask.shape[:2] != image.shape[:2]:
            mask = cv2.resize(mask, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)
            
        return mask

class SAM2Model:
    def __init__(self, weights_path: str):
        self.weights_path = weights_path
        print(f"Initializing SAM2Model with weights: {weights_path}")
        
        if not os.path.exists(weights_path):
             if os.path.exists(os.path.join("..", weights_path)):
                self.weights_path = os.path.join("..", weights_path)
        
        try:
            from ultralytics import SAM
            self.model = SAM(self.weights_path)
        except Exception as e:
            print(f"Error loading SAM model: {e}")
            self.model = None
    
    def segment(self, image: np.ndarray, bbox: list):
        """
        Run segmentation on the image within the bbox using SAM.
        bbox: [x, y, w, h]
        """
        if self.model is None:
            return None
            
        # SAM via Ultralytics accepts bboxes parameter
        # Format for ultralytics predict: bboxes=[[x1, y1, x2, y2]]
        x, y, w, h = bbox
        x2 = x + w
        y2 = y + h
        
        # Run inference with bbox prompt
        # Note: Ultralytics SAM implementation might vary. 
        # Standard usage: model(source, bboxes=[...])
        try:
            results = self.model(image, bboxes=[[x, y, x2, y2]], verbose=False)
            
            if not results or not results[0].masks:
                return None
                
            # Get the mask
            # SAM might return multiple masks? Usually returns one combined or best?
            # Ultralytics SAM wrapper usually returns masks similar to YOLO
            
            mask_tensor = results[0].masks.data[0]
            mask = mask_tensor.cpu().numpy().astype(np.uint8) * 255
            
            if mask.shape[:2] != image.shape[:2]:
                mask = cv2.resize(mask, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)
                
            return mask
            
        except Exception as e:
            print(f"SAM segmentation failed: {e}")
            return None

class GeminiClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        print("Initializing GeminiClient")
    
    def transcribe(self, audio_path: str):
        """
        Transcribe audio using Gemini API.
        """
        # Mock implementation
        return "This is a mock transcription of the video audio."
