import React, { useRef, useState, useEffect } from 'react';

interface AnnotationCanvasProps {
    imageUrl: string | null;
    onProcess: (bbox: number[]) => void;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ imageUrl, onProcess }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
    const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);

    // Initial draw of the image
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageUrl) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = imageUrl; // URL is already full path from App.tsx
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
    }, [imageUrl]);

    // Redraw when drawing bbox
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageUrl) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = imageUrl; // URL is already full path from App.tsx

        // We need to wait for image to load to redraw it, 
        // but since it's likely cached from the previous effect, it should be fast.
        // However, to be safe and avoid flickering, we should really only draw the rect if we can.
        // For this simple tool, let's just redraw image + rect.

        if (img.complete) {
            draw(ctx, img);
        } else {
            img.onload = () => draw(ctx, img);
        }

        function draw(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
            // Clear and redraw image
            ctx.clearRect(0, 0, canvas!.width, canvas!.height);
            ctx.drawImage(img, 0, 0);

            // Draw Rect
            if (startPos && currentPos) {
                const x = Math.min(startPos.x, currentPos.x);
                const y = Math.min(startPos.y, currentPos.y);
                const w = Math.abs(currentPos.x - startPos.x);
                const h = Math.abs(currentPos.y - startPos.y);

                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, w, h);

                ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                ctx.fillRect(x, y, w, h);
            }
        }

    }, [startPos, currentPos, imageUrl]);

    const getCoords = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDrawing(true);
        const coords = getCoords(e);
        setStartPos(coords);
        setCurrentPos(coords);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        setCurrentPos(getCoords(e));
    };

    const handleMouseUp = () => {
        if (!isDrawing || !startPos || !currentPos || !canvasRef.current) return;
        setIsDrawing(false);

        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const w = Math.abs(currentPos.x - startPos.x);
        const h = Math.abs(currentPos.y - startPos.y);

        // Ignore tiny boxes
        if (w < 10 || h < 10) {
            setStartPos(null);
            setCurrentPos(null);
            return;
        }

        // Normalize coordinates for backend
        const nx = x / canvasRef.current.width;
        const ny = y / canvasRef.current.height;
        const nw = w / canvasRef.current.width;
        const nh = h / canvasRef.current.height;

        onProcess([nx, ny, nw, nh]);

        // Clear selection after processing
        setStartPos(null);
        setCurrentPos(null);
    };

    if (!imageUrl) return <div className="text-gray-500">No frame selected</div>;

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
            className="max-h-full max-w-full cursor-crosshair"
        />
    );
};

export default AnnotationCanvas;
