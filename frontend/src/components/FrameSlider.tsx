import React from 'react';

interface Props {
    frames: string[];
    selectedFrame: string | null;
    onSelect: (frameUrl: string) => void;
}

const FrameSlider: React.FC<Props> = ({ frames, selectedFrame, onSelect }) => {
    return (
        <div className="w-full overflow-x-auto whitespace-nowrap bg-gray-900 p-2 h-32">
            {frames.map((frame, idx) => (
                <img
                    key={idx}
                    src={`http://localhost:8000${frame}`}
                    alt={`Frame ${idx}`}
                    className={`inline-block h-24 mr-2 cursor-pointer border-2 ${selectedFrame === frame ? 'border-blue-500' : 'border-transparent'
                        }`}
                    onClick={() => onSelect(frame)}
                />
            ))}
        </div>
    );
};

export default FrameSlider;
