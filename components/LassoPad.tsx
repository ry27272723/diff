import React, { useRef, useState, useEffect } from 'react';
import { Point } from '../types';

interface LassoPadProps {
  onShapeComplete: (points: Point[]) => void;
}

const LassoPad: React.FC<LassoPadProps> = ({ onShapeComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background guide
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.setLineDash([]);

    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // If finished (auto-closed visually for preview)
      if (!isDrawing && points.length > 2) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [points, isDrawing]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    setIsDrawing(true);
    const pos = getPos(e);
    if (pos) setPoints([pos]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    if (pos) {
      setPoints(prev => [...prev, pos]);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Simplify and finalize shape
    if (points.length > 5) {
      onShapeComplete(points);
    } else {
        // Too small, reset
        setPoints([]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative border border-neutral-700 bg-neutral-900 h-48 rounded-md overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!isDrawing && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-500 text-sm">
            Draw shape here
          </div>
        )}
      </div>
      <button 
        onClick={() => setPoints([])}
        className="text-xs text-neutral-400 underline hover:text-white self-end"
      >
        Clear Drawing
      </button>
    </div>
  );
};

export default LassoPad;
