import React from 'react';
import type { TranscriptionSegment } from '../api';

interface RightSidebarProps {
    transcriptionEnabled: boolean;
    transcribing: boolean;
    segments: TranscriptionSegment[];
    currentFrameIndex: number;
    handleSegmentClick: (start: number) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
    transcriptionEnabled,
    transcribing,
    segments,
    currentFrameIndex,
    handleSegmentClick,
}) => {
    return (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
            {/* Transcription Panel */}
            {transcriptionEnabled && (
                <div className="flex-1 border-b border-gray-700 flex flex-col min-h-0">
                    <div className="p-2 bg-gray-900 border-b border-gray-700 font-bold text-yellow-500 text-sm flex justify-between items-center">
                        <span>Transcription</span>
                        {transcribing && <span className="text-xs animate-pulse text-yellow-300">Processing...</span>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-900/50">
                        {segments.length === 0 ? (
                            <div className="text-gray-500 text-xs text-center mt-4">
                                {transcribing ? "Transcribing..." : "No transcription available."}
                            </div>
                        ) : (
                            segments.map((seg, idx) => {
                                // Check if current frame time is within segment
                                // Current time = currentFrameIndex (seconds)
                                const isActive = currentFrameIndex >= seg.start && currentFrameIndex <= seg.end;
                                return (
                                    <div
                                        key={idx}
                                        id={isActive ? "active-transcription-segment" : undefined}
                                        onClick={() => handleSegmentClick(seg.start)}
                                        className={`text-sm p-2 rounded border transition-colors cursor-pointer hover:bg-gray-700 ${isActive
                                            ? "bg-yellow-900/40 border-yellow-600 text-yellow-100"
                                            : "bg-gray-800 border-gray-700 text-gray-300"
                                            }`}
                                    >
                                        <div className="text-xs text-gray-500 mb-1">
                                            {new Date(seg.start * 1000).toISOString().substr(14, 5)} -
                                            {new Date(seg.end * 1000).toISOString().substr(14, 5)}
                                        </div>
                                        <div>{seg.text}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RightSidebar;
