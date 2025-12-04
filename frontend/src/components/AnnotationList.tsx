import React, { useState } from 'react';
import type { Annotation } from '../api';
import { BASE_URL } from '../api';

interface AnnotationListProps {
    annotations: Annotation[];
    onSelect: (filename: string, selected: boolean) => void;
    selectedIds: Set<string>; // Using filename as ID for simplicity
}

const PAGE_SIZE = 12; // 3 cols x 4 rows

const AnnotationList: React.FC<AnnotationListProps> = ({ annotations, onSelect, selectedIds }) => {
    const [currentPage, setCurrentPage] = useState(0);

    const totalPages = Math.ceil(annotations.length / PAGE_SIZE);
    const startIndex = currentPage * PAGE_SIZE;
    const currentItems = annotations.slice(startIndex, startIndex + PAGE_SIZE);

    const handlePrev = () => setCurrentPage(p => Math.max(0, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

    const isDragging = React.useRef(false);
    const dragStartState = React.useRef(true); // true = selecting, false = deselecting

    React.useEffect(() => {
        const handleMouseUp = () => {
            isDragging.current = false;
        };
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const handleMouseDown = (filename: string, currentlySelected: boolean) => {
        isDragging.current = true;
        dragStartState.current = !currentlySelected;
        onSelect(filename, !currentlySelected);
    };

    const handleMouseEnter = (filename: string) => {
        if (isDragging.current) {
            onSelect(filename, dragStartState.current);
        }
    };

    if (annotations.length === 0) {
        return <div className="text-gray-500 text-sm p-4">No annotations for this frame.</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-3 gap-2" onMouseLeave={() => { isDragging.current = false; }}>
                    {currentItems.map((ann, i) => (
                        <div
                            key={i}
                            className={`relative aspect-square bg-black rounded border cursor-pointer overflow-hidden group transition-all ${selectedIds.has(ann.filename) ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600 hover:border-gray-400'}`}
                            onMouseEnter={() => handleMouseEnter(ann.filename)}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleMouseDown(ann.filename, selectedIds.has(ann.filename));
                            }}
                        >
                            <img src={`${BASE_URL}${ann.url}`} className="w-full h-full object-contain" alt={ann.label} />

                            <div className="absolute bottom-0 left-0 bg-black bg-opacity-70 text-xs px-1 w-full truncate text-white">
                                {ann.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700 shrink-0">
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

export default AnnotationList;
