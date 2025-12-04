import React from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    samplingRate: number;
    onSamplingRateChange: (rate: number) => void;
    confidence: number;
    onConfidenceChange: (conf: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    samplingRate,
    onSamplingRateChange,
    confidence,
    onConfidenceChange
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl w-96 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Settings</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Frame Sampling Rate (seconds)</label>
                    <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={samplingRate}
                        onChange={(e) => onSamplingRateChange(parseFloat(e.target.value))}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Lower value = more frames (slower loading)</p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Detection Confidence Threshold</label>
                    <div className="flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={confidence}
                            onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
                            className="w-full mr-2"
                        />
                        <span className="w-12 text-right">{confidence.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
