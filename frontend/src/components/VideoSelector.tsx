import React, { useEffect, useState } from 'react';
import { fetchVideos } from '../api';
import type { VideoInfo } from '../api';

interface Props {
    onSelect: (video: VideoInfo) => void;
}

const VideoSelector: React.FC<Props> = ({ onSelect }) => {
    const [videos, setVideos] = useState<VideoInfo[]>([]);
    const [selected, setSelected] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVideos().then(data => {
            setVideos(data);
            if (data.length > 0) {
                // Default to first (which should be GX010103.MP4 if present due to backend sort)
                setSelected(data[0].path);
                onSelect(data[0]);
            } else {
                setError("No videos found in the configured directory.");
            }
        }).catch(err => {
            console.error(err);
            setError("Failed to load videos.");
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const path = e.target.value;
        setSelected(path);
        const video = videos.find(v => v.path === path);
        if (video) onSelect(video);
    };

    if (error) {
        return <div className="p-4 bg-red-800 text-white text-sm">{error}</div>;
    }

    return (
        <div className="p-4 bg-gray-800 text-white">
            <label className="block mb-2 text-sm font-bold">Select Video</label>
            <select
                value={selected}
                onChange={handleChange}
                className="w-full p-2 text-black rounded"
                disabled={videos.length === 0}
            >
                {videos.length === 0 && <option>No videos</option>}
                {videos.map(v => (
                    <option key={v.path} value={v.path}>{v.filename}</option>
                ))}
            </select>
        </div>
    );
};

export default VideoSelector;
