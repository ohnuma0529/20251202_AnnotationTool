import React from 'react';
import type { Annotation, FishCrop } from '../api';
import AnnotationCanvas from './AnnotationCanvas';
import AnnotationList from './AnnotationList';
import CropList from './CropList';
import { BASE_URL } from '../api';

interface MainContentProps {
    loading: boolean;
    progress: number;
    frames: string[];
    currentFrameIndex: number;
    handleSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setCurrentFrameIndex: (index: number) => void;
    handleProcess: (bbox: number[]) => void;
    savedAnnotations: Annotation[];
    handleAnnotationSelect: (filename: string, selected: boolean) => void;
    selectedAnnotationIds: Set<string>;
    handleDelete: () => void;
    crops: FishCrop[];
    processing: boolean;
    handleCropSelect: (id: string, selected: boolean) => void;
    selectedCropIds: Set<string>;
    handleSave: () => void;
}

const MainContent: React.FC<MainContentProps> = ({
    loading,
    progress,
    frames,
    currentFrameIndex,
    handleSliderChange,
    setCurrentFrameIndex,
    handleProcess,
    savedAnnotations,
    handleAnnotationSelect,
    selectedAnnotationIds,
    handleDelete,
    crops,
    processing,
    handleCropSelect,
    selectedCropIds,
    handleSave,
}) => {
    return (
        <div className="flex-1 flex flex-col items-center p-4 relative overflow-hidden">
            {loading ? (
                <div className="text-xl animate-pulse mt-20">Loading Frames... {progress}%</div>
            ) : frames.length > 0 ? (
                <div className="w-full max-w-6xl flex flex-col h-full">

                    {/* Top Area: Canvas & Slider */}
                    <div className="flex flex-col items-center mb-4 shrink-0 w-fit mx-auto">
                        {/* Image Display / Canvas */}
                        <div className="relative border border-gray-700 shadow-2xl bg-black rounded-lg overflow-hidden mb-2" style={{ maxHeight: '40vh' }}>
                            <AnnotationCanvas
                                imageUrl={`${BASE_URL}${frames[currentFrameIndex]}`}
                                onProcess={handleProcess}
                            />
                        </div>

                        {/* Bottom Controls */}
                        <div className="p-2 flex flex-col gap-2 w-full">
                            {frames.length > 0 && (
                                <>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Frame: {currentFrameIndex + 1} / {frames.length}</span>
                                        <span>Time: {new Date(currentFrameIndex * 1000).toISOString().substr(14, 5)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={frames.length - 1}
                                        value={currentFrameIndex}
                                        onChange={handleSliderChange}
                                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <div className="flex justify-center gap-4 mt-2">
                                        <button
                                            onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
                                            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            onClick={() => setCurrentFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1))}
                                            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom Area: Saved vs Detected */}
                    <div className="flex-1 flex gap-4 min-h-0 w-full">
                        {/* Saved Annotations */}
                        <div className="w-1/3 bg-gray-800 p-4 rounded-lg overflow-hidden flex flex-col border border-gray-700 shadow-sm relative">
                            <div className="flex justify-between items-center mb-2 shrink-0">
                                <h3 className="font-bold text-green-400">Saved Annotations</h3>
                            </div>
                            <div className="flex-1 min-h-0 bg-gray-900/50 rounded p-2 mb-10">
                                <AnnotationList
                                    annotations={savedAnnotations}
                                    onSelect={handleAnnotationSelect}
                                    selectedIds={selectedAnnotationIds}
                                />
                            </div>
                            {/* Delete Button - Bottom Right Absolute */}
                            <div className="absolute bottom-4 right-4 left-4">
                                <button
                                    onClick={handleDelete}
                                    disabled={selectedAnnotationIds.size === 0}
                                    className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 rounded font-bold text-sm shadow-lg transition-colors"
                                >
                                    Delete Annotation ({selectedAnnotationIds.size})
                                </button>
                            </div>
                        </div>

                        {/* Detected Crops */}
                        <div className="w-2/3 bg-gray-800 p-4 rounded-lg overflow-hidden flex flex-col border border-gray-700 shadow-sm relative">
                            <div className="flex justify-between items-center mb-2 shrink-0">
                                <h3 className="font-bold text-blue-400">Detected Fish {processing && <span className="text-xs text-yellow-400 ml-2">(Processing...)</span>}</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-xs text-gray-400">
                                        {crops.length} detected
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 bg-gray-900/50 rounded overflow-hidden mb-10">
                                <CropList
                                    crops={crops}
                                    loading={processing}
                                    onSelect={handleCropSelect}
                                    selectedIds={selectedCropIds}
                                />
                            </div>

                            {/* Save Button - Bottom Right Absolute */}
                            <div className="absolute bottom-4 right-4 left-4">
                                <button
                                    onClick={handleSave}
                                    disabled={selectedCropIds.size === 0}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 rounded font-bold text-sm shadow-lg transition-colors"
                                >
                                    Save Annotation ({selectedCropIds.size})
                                </button>
                            </div>
                        </div>


                    </div>
                </div>
            ) : (
                <div className="text-gray-500 mt-20">No frames loaded. Select a video.</div>
            )}
        </div>
    );
};

export default MainContent;
