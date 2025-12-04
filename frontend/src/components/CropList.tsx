import React from 'react';
import type { FishCrop } from '../api';
import { BASE_URL } from '../api';

interface CropListProps {
    crops: FishCrop[];
    loading: boolean;
    onSelect: (id: string, selected: boolean) => void;
    selectedIds: Set<string>;
}

const PAGE_SIZE = 100; // Show many items before paginating

const CropList: React.FC<CropListProps> = ({ crops, loading, onSelect, selectedIds }) => {
    const [currentPage, setCurrentPage] = React.useState(0);

    // Reset page when crops change
    React.useEffect(() => {
        setCurrentPage(0);
    }, [crops]);

    const isDragging = React.useRef(false);
    const dragStartState = React.useRef(true); // true = selecting, false = deselecting

    React.useEffect(() => {
        const handleMouseUp = () => {
            isDragging.current = false;
        };
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const handleMouseDown = (id: string, currentlySelected: boolean) => {
        isDragging.current = true;
        dragStartState.current = !currentlySelected;
        onSelect(id, !currentlySelected);
    };

    const handleMouseEnter = (id: string) => {
        if (isDragging.current) {
            onSelect(id, dragStartState.current);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-32 flex items-center justify-center bg-gray-800 text-blue-400 animate-pulse">
                Processing... Detecting Fish...
            </div>
        );
    }

    if (crops.length === 0) {
        return <div className="text-gray-500 text-sm p-4">No fish detected in this region.</div>;
    }

    const totalPages = Math.ceil(crops.length / PAGE_SIZE);
    const startIndex = currentPage * PAGE_SIZE;
    const currentItems = crops.slice(startIndex, startIndex + PAGE_SIZE);

    const handlePrev = () => setCurrentPage(p => Math.max(0, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

    return (
        <div className="flex flex-col h-full p-2">
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-6 gap-2" onMouseLeave={() => { isDragging.current = false; }}>
                    {currentItems.map((crop) => (
                        <div
                            key={crop.id}
                            className={`relative aspect-square bg-black rounded border cursor-pointer overflow-hidden group transition-all ${selectedIds.has(crop.id) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-600 hover:border-gray-400'}`}
                            onMouseEnter={() => handleMouseEnter(crop.id)}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleMouseDown(crop.id, selectedIds.has(crop.id));
                            }}
                        >
                            <img
                                src={`${BASE_URL}${crop.url}`}
                                alt="Fish Crop"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700 shrink-0 pb-1">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 0}
                        className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50 hover:bg-gray-600"
                    >
                        Prev
                    </button>
                    <span className="text-xs text-gray-400">
                        Page {currentPage + 1} / {totalPages}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages - 1}
                        className="px-2 py-1 bg-gray-700 rounded text-xs disabled:opacity-50 hover:bg-gray-600"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default CropList;
