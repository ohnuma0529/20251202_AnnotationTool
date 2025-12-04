#!/bin/bash

# Activate conda environment
source /home/ohnuma/anaconda3/etc/profile.d/conda.sh
conda activate fish_annotation

# Run preprocessing script
echo "Starting background preprocessing..."
cd /home/ohnuma/Marine/20251202_AnnotationTool/backend
python preprocess_videos.py

echo "Preprocessing finished."
