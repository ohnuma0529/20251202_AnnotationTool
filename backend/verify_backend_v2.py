import requests
import os
import sys

BASE_URL = "http://localhost:8000/api"

def test_list_videos():
    print("Testing list_videos...")
    try:
        response = requests.get(f"{BASE_URL}/videos")
        if response.status_code == 200:
            videos = response.json()
            print(f"Success: Found {len(videos)} videos.")
            for v in videos[:3]:
                print(f" - {v['filename']}")
            return videos
        else:
            print(f"Failed: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"Error: {e}")
        return []

def test_extract_frames(video_path):
    print(f"Testing extract_frames for {video_path}...")
    try:
        # Simplified API only takes video_path
        response = requests.get(f"{BASE_URL}/frames", params={"video_path": video_path})
        response.raise_for_status()
        data = response.json()
        frames = data['frames']
        print(f"Success: Extracted {len(frames)} frames.")
        if len(frames) > 0:
            print(f"Sample frame URL: {frames[0]}")
            if "/static/frames" not in frames[0]:
                print("Warning: Frame URL does not contain /static/frames")
        return frames
    except Exception as e:
        print(f"Error extracting frames: {e}")
        return []

def test_process_region(frame_url):
    print(f"Testing process_region for {frame_url}...")
    try:
        # Dummy bbox (normalized)
        # Assuming frame is 1920x1080, let's take a center crop
        payload = {
            "frame_url": frame_url,
            "bbox": [0.25, 0.25, 0.5, 0.5] # x, y, w, h
        }
        response = requests.post(f"{BASE_URL}/process", json=payload)
        # Check for 404/500
        if response.status_code != 200:
             print(f"Failed: {response.status_code} - {response.text}")
             return

        data = response.json()
        print(f"Success: Detected {len(data['fish'])} fish.")
        if len(data['fish']) > 0:
            print(f"Sample fish crop: {data['fish'][0]['url']}")
    except Exception as e:
        print(f"Error processing region: {e}")

if __name__ == "__main__":
    videos = test_list_videos()
    if videos:
        frames = test_extract_frames(videos[0]['path'])
        if frames:
            test_process_region(frames[0])
