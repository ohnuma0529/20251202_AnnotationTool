import { getApiBaseUrl } from './config';

export const BASE_URL = getApiBaseUrl();
const API_BASE = `${BASE_URL}/api`;

export interface VideoInfo {
    filename: string;
    path: string;
}

export interface FrameResponse {
    frames: string[];
    count: number;
}

export interface FishCrop {
    id: string;
    url: string;
    bbox: number[];
    confidence: number;
}

export interface ProcessResponse {
    fish: FishCrop[];
}

export const fetchVideos = async (): Promise<VideoInfo[]> => {
    const res = await fetch(`${API_BASE}/videos`);
    if (!res.ok) throw new Error("Failed to fetch videos");
    return res.json();
};

export const fetchFrames = async (videoPath: string): Promise<FrameResponse> => {
    const res = await fetch(`${API_BASE}/frames?video_path=${encodeURIComponent(videoPath)}`);
    if (!res.ok) throw new Error("Failed to fetch frames");
    return res.json();
};

export const processRegion = async (frameUrl: string, bbox: number[], confThreshold: number = 0.25, sizeThreshold: number = 0.0, autoSegmentation: boolean = false, segModel: string = "YOLO"): Promise<{ fish: FishCrop[] }> => {
    const res = await fetch(`${API_BASE}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            frame_url: frameUrl,
            bbox,
            conf_threshold: confThreshold,
            size_threshold: sizeThreshold,
            auto_segmentation: autoSegmentation,
            seg_model: segModel
        })
    });
    if (!res.ok) throw new Error("Processing failed");
    return res.json();
};

export interface Annotation {
    url: string;
    label: string;
    filename: string;
}

export interface AnnotationResponse {
    annotations: Annotation[];
}

export const fetchAnnotations = async (videoName: string, frameIndex: number): Promise<AnnotationResponse> => {
    const res = await fetch(`${API_BASE}/annotations?video_name=${encodeURIComponent(videoName)}&frame_index=${frameIndex}`);
    if (!res.ok) throw new Error("Failed to fetch annotations");
    return res.json();
};

export const saveAnnotations = async (videoName: string, label: string, crops: FishCrop[], frameIndex: number): Promise<any> => {
    // Add frame_index to crops if needed, or pass it separately
    // Backend expects crops list with {url, frame_index, bbox}
    // Our FishCrop has {id, url, bbox}. We need to augment it.

    const payloadCrops = crops.map(c => ({
        url: c.url,
        bbox: c.bbox,
        frame_index: frameIndex
    }));

    const res = await fetch(`${API_BASE}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            video_name: videoName,
            label,
            crops: payloadCrops
        }),
    });
    if (!res.ok) throw new Error("Failed to save annotations");
    return res.json();
};

export const exportAnnotations = async (videoNames: string[]) => {
    const res = await fetch(`${API_BASE}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_names: videoNames })
    });

    if (!res.ok) {
        throw new Error("Export failed");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "annotations_export.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

export async function deleteAnnotations(videoName: string, annotations: Annotation[]) {
    const res = await fetch(`${API_BASE}/delete_annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            video_name: videoName,
            annotations: annotations.map(a => ({ filename: a.filename, label: a.label }))
        })
    });
    if (!res.ok) throw new Error("Failed to delete annotations");
    return res.json();
}

export interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
}

export const transcribeVideo = async (videoName: string, model: string = "large", force: boolean = false): Promise<{ segments: TranscriptionSegment[] }> => {
    const res = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_name: videoName, model, force })
    });
    if (!res.ok) throw new Error("Failed to transcribe video");
    return res.json();
};

export const fetchTranscription = async (videoName: string): Promise<{ segments: TranscriptionSegment[] }> => {
    const res = await fetch(`${API_BASE}/transcription?video_name=${encodeURIComponent(videoName)}&t=${Date.now()}`);
    if (!res.ok) throw new Error("Failed to fetch transcription");
    return res.json();
};

export const fetchProgress = async (videoName: string): Promise<{ progress: number }> => {
    const res = await fetch(`${API_BASE}/progress/${encodeURIComponent(videoName)}`);
    if (!res.ok) throw new Error("Failed to fetch progress");
    return res.json();
};
