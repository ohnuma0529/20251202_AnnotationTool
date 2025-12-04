import React from 'react';
import type { VideoInfo } from '../api';

interface LeftSidebarProps {
    videos: VideoInfo[];
    selectedVideoPath: string;
    setSelectedVideoPath: (path: string) => void;
    handleExportClick: () => void;

    // Detection Settings
    autoMode: boolean;
    setAutoMode: (v: boolean) => void;
    confThreshold: number;
    setConfThreshold: (v: number) => void;
    sizeThreshold: number;
    setSizeThreshold: (v: number) => void;

    // Segmentation Settings
    autoSegmentation: boolean;
    setAutoSegmentation: (v: boolean) => void;
    segModel: string;
    setSegModel: (v: string) => void;

    // Transcription Settings
    transcriptionEnabled: boolean;
    setTranscriptionEnabled: (v: boolean) => void;
    transcriptionModel: string;
    setTranscriptionModel: (v: string) => void;
    handleRetranscribe: () => void;
    transcribing: boolean;

    // Labeling
    label: string;
    setLabel: (v: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
    videos,
    selectedVideoPath,
    setSelectedVideoPath,
    handleExportClick,
    autoMode,
    setAutoMode,
    confThreshold,
    setConfThreshold,
    sizeThreshold,
    setSizeThreshold,
    autoSegmentation,
    setAutoSegmentation,
    segModel,
    setSegModel,
    transcriptionEnabled,
    setTranscriptionEnabled,
    transcriptionModel,
    setTranscriptionModel,
    handleRetranscribe,
    transcribing,
    label,
    setLabel,
}) => {
    return (
        <div className="w-64 bg-gray-800 p-4 border-r border-gray-700 flex flex-col gap-6 overflow-y-auto shrink-0">
            <h1 className="text-xl font-bold text-blue-400">Fish Annotation Tool</h1>

            {/* Video Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Video</label>
                <select
                    value={selectedVideoPath}
                    onChange={(e) => setSelectedVideoPath(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 p-2 rounded text-white text-sm"
                >
                    {videos.map(v => (
                        <option key={v.path} value={v.path}>{v.filename}</option>
                    ))}
                </select>

                <button
                    onClick={handleExportClick}
                    className="mt-2 w-full bg-green-700 hover:bg-green-600 text-white text-xs py-1 px-2 rounded flex items-center justify-center gap-1"
                >
                    <span>📥</span> Export Annotations
                </button>
            </div>

            {/* Detection Settings */}
            <div className="border-t border-gray-700 pt-4">
                <h2 className="font-bold mb-3 text-blue-300">Detection Settings</h2>

                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="autoMode"
                            checked={autoMode}
                            onChange={(e) => setAutoMode(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="autoMode" className="ml-2 text-sm font-medium text-gray-300">Auto Detection</label>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Confidence Threshold: {confThreshold}</label>
                        <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={confThreshold}
                            onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Min Size Ratio: {sizeThreshold.toFixed(2)}</label>
                        <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.01"
                            value={sizeThreshold}
                            onChange={(e) => setSizeThreshold(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Segmentation Settings */}
            <div className="border-t border-gray-700 pt-4">
                <h2 className="font-bold mb-3 text-purple-300">Segmentation Settings</h2>

                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="autoSegmentation"
                            checked={autoSegmentation}
                            onChange={(e) => setAutoSegmentation(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <label htmlFor="autoSegmentation" className="ml-2 text-sm font-medium text-gray-300">Auto Segmentation</label>
                    </div>

                    {autoSegmentation && (
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Segmentation Model</label>
                            <select
                                value={segModel}
                                onChange={(e) => setSegModel(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 p-1 rounded text-white text-xs"
                            >
                                <option value="YOLO">YOLOv12n-seg</option>
                                <option value="SAM">SAM (Segment Anything)</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Transcription Settings */}
            <div className="border-t border-gray-700 pt-4">
                <h2 className="font-bold mb-3 text-yellow-300">Transcription Settings</h2>

                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="transcriptionEnabled"
                            checked={transcriptionEnabled}
                            onChange={(e) => setTranscriptionEnabled(e.target.checked)}
                            className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2"
                        />
                        <label htmlFor="transcriptionEnabled" className="ml-2 text-sm font-medium text-gray-300">Auto Transcription</label>
                    </div>
                </div>

                {transcriptionEnabled && (
                    <div className="space-y-2 mt-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Model</label>
                            <select
                                value={transcriptionModel}
                                onChange={(e) => setTranscriptionModel(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                            >
                                <option value="tiny">Tiny (Fastest)</option>
                                <option value="base">Base</option>
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large (Best)</option>
                            </select>
                        </div>
                        <button
                            onClick={handleRetranscribe}
                            disabled={transcribing}
                            className="w-full bg-yellow-700 hover:bg-yellow-600 text-white text-xs py-1 px-2 rounded disabled:opacity-50"
                        >
                            {transcribing ? 'Transcribing...' : 'Re-transcribe'}
                        </button>
                    </div>
                )}
            </div>

            {/* Label Input */}
            <div className="border-t border-gray-700 pt-4">
                <h2 className="font-bold mb-3 text-green-300">Labeling</h2>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Class Label</label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-white text-sm"
                    />
                </div>
            </div>
        </div>
    );
};

export default LeftSidebar;
