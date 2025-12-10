
import React, { useState, useRef } from 'react';
import MainCanvas from './components/MainCanvas';
import ControlPanel from './components/ControlPanel';
import { Entity, Point } from './types';
import * as C from './constants';

const App: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper to measure text before adding to get physical dimensions
  const measureText = (text: string, size: number, weight: number, fontFamily: string): { width: number, height: number } => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { width: size, height: size };
    
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    
    // Estimate height based on font size if actual bounding box not supported well in all browsers,
    // but actualBoundingBoxAscent is widely supported now.
    const height = (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) || size;
    const width = metrics.width;
    
    return { width, height };
  };

  const handleAddText = (text: string, size: number, weight: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = rect.width / 2;

    const chars = text.split('');
    const newEntities: Entity[] = [];
    
    let totalWidth = 0;
    // Calculate total width to center the word group initially (approx)
    // For simplicity, we just spawn them spread out slightly
    
    chars.forEach((char, i) => {
      if (char === ' ') return; // Skip spaces
      
      const dim = measureText(char, size, weight, C.DEFAULT_FONT_FAMILY);
      
      // Randomize spawn position slightly, but fall vertically
      const randomX = (Math.random() - 0.5) * (rect.width * 0.4); 

      newEntities.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        text: char,
        x: startX + randomX + (i * (size * 0.5)), // Stagger slightly
        y: C.SPAWN_Y_OFFSET - (Math.random() * 100),
        rotation: 0, // Fall vertically without rotation
        velocity: {
          x: 0, // Fall vertically
          y: 0,
          rotation: 0 // No rotation
        },
        width: dim.width,
        height: dim.height,
        isDragging: false,
        isStatic: false,
        fontSize: size,
        fontWeight: weight,
        fontFamily: C.DEFAULT_FONT_FAMILY
      });
    });

    setEntities(prev => [...prev, ...newEntities]);
  };

  const handleAddShape = (points: Point[], scale: number) => {
    if (!canvasRef.current || points.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // 1. Calculate Bounding Box of the drawn shape
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const width = (maxX - minX) * scale;
    const height = (maxY - minY) * scale;
    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    // 2. Normalize points relative to center (0,0) and apply scale
    const centeredPoints = points.map(p => ({
      x: (p.x - centerX) * scale,
      y: (p.y - centerY) * scale
    }));

    // 3. Create Entity
    const newEntity: Entity = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'shape',
      points: centeredPoints,
      x: rect.width / 2 + (Math.random() - 0.5) * 100,
      y: C.SPAWN_Y_OFFSET,
      rotation: 0, // Fall vertically without rotation
      velocity: {
        x: 0, // Fall vertically
        y: 0,
        rotation: 0 // No rotation
      },
      width: width,
      height: height,
      isDragging: false,
      isStatic: false
    };

    setEntities(prev => [...prev, newEntity]);
  };

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `monochrome-diff-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleClearCanvas = () => {
    setEntities([]);
  };

  return (
    <div className="flex flex-col md:flex-row-reverse h-screen w-screen bg-black overflow-hidden font-sans">
      <MainCanvas 
        entities={entities} 
        setEntities={setEntities} 
        canvasRef={canvasRef} 
      />
      <ControlPanel 
        onAddText={handleAddText} 
        onAddShape={handleAddShape}
        onSaveImage={handleSaveImage}
        onClearCanvas={handleClearCanvas}
      />
    </div>
  );
};

export default App;
