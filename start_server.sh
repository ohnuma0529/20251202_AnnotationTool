#!/bin/bash

# Activate conda environment
source /home/ohnuma/anaconda3/etc/profile.d/conda.sh
conda activate fish_annotation

# Start Backend
echo "Starting Backend..."
cd /home/ohnuma/Marine/20251202_AnnotationTool/backend
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd /home/ohnuma/Marine/20251202_AnnotationTool/frontend
npm run dev &
FRONTEND_PID=$!

echo "Server started."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
