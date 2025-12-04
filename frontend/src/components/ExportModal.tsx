import React from 'react';
import type { VideoInfo } from '../api';

interface ExportModalProps {
    videos: VideoInfo[];
    exportSelectedVideos: Set<string>;
    toggleExportVideoSelect: (videoName: string) => void;
    onClose: () => void;
    onConfirm: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
    videos,
    exportSelectedVideos,
    toggleExportVideoSelect,
    onClose,
    onConfirm,
}) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-96 max-h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-blue-400">Export Annotations</h2>
                <div className="flex-1 overflow-y-auto mb-4 border border-gray-700 rounded p-2">
                    {videos.map(v => {
                        const vName = v.filename.split('.')[0];
                        return (
                            <div key={v.path} className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    checked={exportSelectedVideos.has(vName)}
                                    onChange={() => toggleExportVideoSelect(vName)}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                                />
                                <span className="ml-2 text-sm">{v.filename}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 text-sm font-bold"
                    >
                        Download ZIP
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
