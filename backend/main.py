from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import router as api_router
from config import settings
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Fish Annotation Tool API")

# CORS configuration
origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

# Ensure data directories exist
os.makedirs("data/frames", exist_ok=True)
os.makedirs("data/crops", exist_ok=True)

# Mount static files
# We mount the frame cache directory to /static/frames
if not os.path.exists(settings.FRAME_CACHE_DIR):
    try:
        os.makedirs(settings.FRAME_CACHE_DIR, exist_ok=True)
    except Exception as e:
        print(f"Warning: Could not create cache dir {settings.FRAME_CACHE_DIR}: {e}")

app.mount("/static/frames", StaticFiles(directory=settings.FRAME_CACHE_DIR), name="frames")

# Mount annotations directory
if not os.path.exists(settings.ANNOTATION_DIR):
    try:
        os.makedirs(settings.ANNOTATION_DIR, exist_ok=True)
    except Exception as e:
        print(f"Warning: Could not create annotation dir {settings.ANNOTATION_DIR}: {e}")

app.mount("/static/annotations", StaticFiles(directory=settings.ANNOTATION_DIR), name="annotations")

# Keep /data for backward compatibility or other assets if needed, but frames are now in /static/frames
if not os.path.exists("data"):
    os.makedirs("data")
app.mount("/data", StaticFiles(directory="data"), name="data") 

# Mount video directory if it exists
if os.path.exists(settings.VIDEO_DIR):
    # We mount it to allow frontend to potentially access videos directly if needed, 
    # though we mainly serve frames. 
    # Actually, for security/simplicity, maybe we don't need to mount the raw video dir 
    # if we only serve extracted frames.
    # But let's keep it flexible.
    pass 

@app.get("/")
def read_root():
    return {"message": "Fish Annotation Tool API is running"}
