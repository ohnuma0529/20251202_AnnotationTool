import React, { useState } from 'react';
import { saveAnnotations } from '../api';
import type { FishCrop } from '../api';

interface Props {
    crops: FishCrop[];
    onSaveComplete: () => void;
}

const ResultsPanel: React.FC<Props> = ({ crops, onSaveComplete }) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [label, setLabel] = useState("");
    const [saving, setSaving] = useState(false);

    const toggleSelection = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSave = async () => {
        if (!label) {
            alert("Please enter a label");
            return;
        }
        if (selectedIds.size === 0) {
            alert("Please select at least one image");
            return;
        }

        setSaving(true);
        try {
            const selectedUrls = crops
                .filter(c => selectedIds.has(c.id))
                .map(c => c.url);

            await saveAnnotations(label, selectedUrls);
            alert("Saved successfully!");
            onSaveComplete();
            setSelectedIds(new Set());
        } catch (err) {
            console.error(err);
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (crops.length === 0) return null;

    return (
        <div className="p-4 bg-gray-800 text-white h-full flex flex-col">
            <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Detected Fish</h3>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {crops.map(crop => (
                    <div key={crop.id} className="flex items-start space-x-3 bg-gray-700 p-2 rounded hover:bg-gray-600 transition-colors">
                        <div className="relative">
                            <img
                                src={`http://localhost:8000${crop.url}`}
                                alt="Fish"
                                className="w-24 h-24 object-cover rounded"
                            />
                            <input
                                type="checkbox"
                                checked={selectedIds.has(crop.id)}
                                onChange={() => toggleSelection(crop.id)}
                                className="absolute top-1 right-1 w-5 h-5 cursor-pointer accent-blue-500"
                            />
                        </div>
                        <div className="text-sm text-gray-300">
                            <p>ID: {crop.id}</p>
                            <p>BBox: {crop.bbox.join(', ')}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-700">
                <label className="block text-sm font-bold mb-2">Label</label>
                <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., Mackerel"
                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 mb-4 text-white focus:outline-none focus:border-blue-500"
                />

                <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                    <span>{selectedIds.size} selected</span>
                    <button
                        onClick={() => setSelectedIds(new Set(crops.map(c => c.id)))}
                        className="text-blue-400 hover:text-blue-300"
                    >
                        Select All
                    </button>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? "Saving..." : "Save Selected"}
                </button>
            </div>
        </div>
    );
};

export default ResultsPanel;
