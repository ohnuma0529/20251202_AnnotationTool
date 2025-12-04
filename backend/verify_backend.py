import requests
import os
import json

BASE_URL = "http://localhost:8000/api"

def test_backend():
    print("Testing Backend...")
    
    # 1. List Videos
    print("\n1. Listing Videos...")
    res = requests.get(f"{BASE_URL}/videos")
    if res.status_code != 200:
        print(f"FAILED: {res.text}")
        return
    videos = res.json()
    print(f"Found {len(videos)} videos")
    if not videos:
        print("Skipping further tests as no videos found.")
        return
    
    video_path = videos[0]['path']
    print(f"Selected video: {video_path}")
    
    # 2. Extract Frames
    print("\n2. Extracting Frames...")
    res = requests.get(f"{BASE_URL}/frames", params={"video_path": video_path, "rate": 1.0, "limit": 10})
    if res.status_code != 200:
        print(f"FAILED: {res.text}")
        return
    data = res.json()
    frames = data['frames']
    print(f"Extracted {len(frames)} frames")
    if not frames:
        print("No frames extracted.")
        return
        
    frame_url = frames[0]
    print(f"Selected frame: {frame_url}")
    
    # 3. Process Region
    print("\n3. Processing Region...")
    # Mock BBox [x, y, w, h]
    bbox = [100, 100, 200, 200]
    res = requests.post(f"{BASE_URL}/process", json={"frame_url": frame_url, "bbox": bbox})
    if res.status_code != 200:
        print(f"FAILED: {res.text}")
        return
    process_data = res.json()
    fish = process_data['fish']
    print(f"Detected {len(fish)} fish")
    
    if not fish:
        print("No fish detected (mock model might return empty if image is small/empty?)")
        # Mock model returns 2 fish always in my implementation
    
    # 4. Save Annotations
    print("\n4. Saving Annotations...")
    if fish:
        selected_urls = [f['url'] for f in fish]
        label = "TestFish"
        res = requests.post(f"{BASE_URL}/save", json={"label": label, "selected_urls": selected_urls})
        if res.status_code != 200:
            print(f"FAILED: {res.text}")
            return
        save_data = res.json()
        print(f"Saved {save_data['count']} images to {save_data['path']}")
        
        # Verify file existence
        save_dir = save_data['path']
        if os.path.exists(save_dir) and len(os.listdir(save_dir)) > 0:
            print("Verification Successful: Files exist on disk.")
        else:
            print("Verification Failed: Files not found on disk.")
    
    print("\nBackend Verification Completed.")

if __name__ == "__main__":
    test_backend()
