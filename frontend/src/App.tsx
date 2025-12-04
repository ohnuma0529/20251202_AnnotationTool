import React, { useState, useEffect } from 'react';
import { fetchVideos, fetchFrames, processRegion, saveAnnotations, fetchAnnotations, deleteAnnotations, transcribeVideo, fetchTranscription, fetchProgress } from './api';
import type { VideoInfo, FishCrop, Annotation, TranscriptionSegment } from './api';
import { CONFIG } from './config';

import ExportModal from './components/ExportModal';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import MainContent from './components/MainContent';

function App() {
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [selectedVideoPath, setSelectedVideoPath] = useState<string>("");
  const [frames, setFrames] = useState<string[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Crop State
  const [crops, setCrops] = useState<FishCrop[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedCropIds, setSelectedCropIds] = useState<Set<string>>(new Set());

  // Annotation State
  const [label, setLabel] = useState("マダイ");
  const [savedAnnotations, setSavedAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationIds, setSelectedAnnotationIds] = useState<Set<string>>(new Set());

  // Settings State
  const [autoMode, setAutoMode] = useState(CONFIG.DEFAULT_AUTO_MODE);
  const [confThreshold, setConfThreshold] = useState(CONFIG.DEFAULT_CONF_THRESHOLD);
  const [sizeThreshold, setSizeThreshold] = useState(CONFIG.DEFAULT_SIZE_THRESHOLD);
  const [autoSegmentation, setAutoSegmentation] = useState(CONFIG.DEFAULT_AUTO_SEGMENTATION);
  const [segModel, setSegModel] = useState(CONFIG.DEFAULT_SEG_MODEL);

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelectedVideos, setExportSelectedVideos] = useState<Set<string>>(new Set());

  // Transcription State
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(CONFIG.DEFAULT_TRANSCRIPTION_ENABLED);
  const [transcriptionModel, setTranscriptionModel] = useState("medium");
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [transcribing, setTranscribing] = useState(false);

  // Load videos on mount
  useEffect(() => {
    fetchVideos().then(data => {
      setVideos(data);
      if (data.length > 0) {
        setSelectedVideoPath(data[0].path);
      }
    }).catch(err => {
      console.error(err);
      alert("Failed to load videos");
    });
  }, []);

  // Load frames when video changes
  useEffect(() => {
    if (!selectedVideoPath) return;

    setLoading(true);
    setProgress(0);
    setCrops([]);
    setSavedAnnotations([]);

    const videoName = selectedVideoPath.split('/').pop()?.split('.')[0] || "";

    // Start polling for progress
    const progressInterval = setInterval(async () => {
      try {
        const res = await fetchProgress(videoName);
        setProgress(res.progress);
      } catch (e) {
        console.error(e);
      }
    }, 1000);

    fetchFrames(selectedVideoPath)
      .then(res => {
        setFrames(res.frames);
        setCurrentFrameIndex(0);
        setProgress(100);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to load frames");
      })
      .finally(() => {
        setLoading(false);
        clearInterval(progressInterval);
      });

    return () => clearInterval(progressInterval);
  }, [selectedVideoPath]);

  // Load annotations and trigger auto-detect when frame changes
  useEffect(() => {
    if (!selectedVideoPath || frames.length === 0) return;

    const videoName = selectedVideoPath.split('/').pop()?.split('.')[0] || "";
    if (!videoName) return;

    // Fetch saved annotations
    fetchAnnotations(videoName, currentFrameIndex)
      .then(res => {
        setSavedAnnotations(res.annotations);
        setSelectedAnnotationIds(new Set()); // Reset selection
      })
      .catch(console.error);

    // Clear current crops
    setCrops([]);
    setSelectedCropIds(new Set());

    // Auto Detection
    if (autoMode) {
      // Debounce slightly to avoid rapid firing on slider drag
      const timer = setTimeout(() => {
        handleProcess([0, 0, 1, 1]); // Full frame
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentFrameIndex, selectedVideoPath, frames.length, autoMode]);

  // Transcription Effect
  useEffect(() => {
    // Clear segments immediately when video or settings change to avoid showing stale data
    setSegments([]);

    if (!selectedVideoPath || !transcriptionEnabled) {
      return;
    }

    const videoName = selectedVideoPath.split('/').pop()?.split('.')[0] || "";
    if (!videoName) return;

    const loadTranscription = async (force = false) => {
      setTranscribing(true); // Show loading state while fetching/transcribing
      try {
        if (!force) {
          // Try fetching existing first
          const res = await fetchTranscription(videoName);
          if (res.segments && res.segments.length > 0) {
            setSegments(res.segments);
            setTranscribing(false);
            return;
          }
        }

        // Trigger transcription
        // If we are here, either force=true OR fetch returned empty.
        // We force transcription to ensure we get a result (and overwrite empty/corrupt files if needed).
        const tRes = await transcribeVideo(videoName, transcriptionModel, true);
        setSegments(tRes.segments);
      } catch (err) {
        console.error("Transcription error:", err);
      } finally {
        setTranscribing(false);
      }
    };

    loadTranscription();
  }, [selectedVideoPath, transcriptionEnabled, transcriptionModel]);

  const handleRetranscribe = async () => {
    if (!selectedVideoPath) return;
    const videoName = selectedVideoPath.split('/').pop()?.split('.')[0] || "";
    setTranscribing(true);
    try {
      const tRes = await transcribeVideo(videoName, transcriptionModel, true);
      setSegments(tRes.segments);
    } catch (err) {
      console.error(err);
    } finally {
      setTranscribing(false);
    }
  };

  // Auto-scroll transcription
  useEffect(() => {
    if (!transcriptionEnabled || segments.length === 0) return;

    const activeEl = document.getElementById('active-transcription-segment');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentFrameIndex, transcriptionEnabled, segments]);

  const handleSegmentClick = (start: number) => {
    const targetFrame = Math.floor(start);
    if (targetFrame >= 0 && targetFrame < frames.length) {
      setCurrentFrameIndex(targetFrame);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrameIndex(parseInt(e.target.value));
  };

  const handleProcess = async (bbox: number[]) => {
    if (frames.length === 0) return;

    setProcessing(true);
    try {
      const frameUrl = frames[currentFrameIndex];
      const res = await processRegion(frameUrl, bbox, confThreshold, sizeThreshold, autoSegmentation, segModel);
      setCrops(res.fish);
      setSelectedCropIds(new Set());
    } catch (err) {
      console.error(err);
      alert("Detection failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleCropSelect = (id: string, selected: boolean) => {
    setSelectedCropIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleAnnotationSelect = (filename: string, selected: boolean) => {
    setSelectedAnnotationIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(filename);
      } else {
        newSet.delete(filename);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!label) {
      alert("Please enter a label");
      return;
    }
    if (selectedCropIds.size === 0) {
      alert("No crops selected");
      return;
    }

    const selectedCrops = crops.filter(c => selectedCropIds.has(c.id));
    const videoName = selectedVideoPath.split('/').pop()?.split('.')[0] || "";

    try {
      await saveAnnotations(videoName, label, selectedCrops, currentFrameIndex);
      const res = await fetchAnnotations(videoName, currentFrameIndex);
      setSavedAnnotations(res.annotations);
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    }
  };

  const handleDelete = async () => {
    if (selectedAnnotationIds.size === 0) {
      alert("No annotations selected for deletion");
      return;
    }

    const videoName = selectedVideoPath.split('/').pop()?.split('.')[0] || "";
    const selectedAnns = savedAnnotations.filter(a => selectedAnnotationIds.has(a.filename));

    try {
      await deleteAnnotations(videoName, selectedAnns);
      const res = await fetchAnnotations(videoName, currentFrameIndex);
      setSavedAnnotations(res.annotations);
      setSelectedAnnotationIds(new Set());
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const handleExportClick = () => {
    setShowExportModal(true);
    if (selectedVideoPath) {
      const videoName = selectedVideoPath.split('/').pop()?.split('.')[0] || "";
      if (videoName) setExportSelectedVideos(new Set([videoName]));
    }
  };

  const handleExportConfirm = async () => {
    if (exportSelectedVideos.size === 0) {
      alert("No videos selected");
      return;
    }
    try {
      const { exportAnnotations } = await import('./api');
      await exportAnnotations(Array.from(exportSelectedVideos));
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      alert("Export failed");
    }
  };

  const toggleExportVideoSelect = (videoName: string) => {
    setExportSelectedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoName)) newSet.delete(videoName);
      else newSet.add(videoName);
      return newSet;
    });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          videos={videos}
          exportSelectedVideos={exportSelectedVideos}
          toggleExportVideoSelect={toggleExportVideoSelect}
          onClose={() => setShowExportModal(false)}
          onConfirm={handleExportConfirm}
        />
      )}

      {/* Left Sidebar */}
      <LeftSidebar
        videos={videos}
        selectedVideoPath={selectedVideoPath}
        setSelectedVideoPath={setSelectedVideoPath}
        handleExportClick={handleExportClick}
        autoMode={autoMode}
        setAutoMode={setAutoMode}
        confThreshold={confThreshold}
        setConfThreshold={setConfThreshold}
        sizeThreshold={sizeThreshold}
        setSizeThreshold={setSizeThreshold}
        autoSegmentation={autoSegmentation}
        setAutoSegmentation={setAutoSegmentation}
        segModel={segModel}
        setSegModel={setSegModel}
        transcriptionEnabled={transcriptionEnabled}
        setTranscriptionEnabled={setTranscriptionEnabled}
        transcriptionModel={transcriptionModel}
        setTranscriptionModel={setTranscriptionModel}
        handleRetranscribe={handleRetranscribe}
        transcribing={transcribing}
        label={label}
        setLabel={setLabel}
      />

      {/* Main Content */}
      <MainContent
        loading={loading}
        progress={progress}
        frames={frames}
        currentFrameIndex={currentFrameIndex}
        handleSliderChange={handleSliderChange}
        setCurrentFrameIndex={setCurrentFrameIndex}
        handleProcess={handleProcess}
        savedAnnotations={savedAnnotations}
        handleAnnotationSelect={handleAnnotationSelect}
        selectedAnnotationIds={selectedAnnotationIds}
        handleDelete={handleDelete}
        crops={crops}
        processing={processing}
        handleCropSelect={handleCropSelect}
        selectedCropIds={selectedCropIds}
        handleSave={handleSave}
      />

      {/* Right Sidebar (Transcription & Tools) */}
      <RightSidebar
        transcriptionEnabled={transcriptionEnabled}
        transcribing={transcribing}
        segments={segments}
        currentFrameIndex={currentFrameIndex}
        handleSegmentClick={handleSegmentClick}
      />
    </div>
  );
}

export default App;
