
import React, { useState } from 'react';
import { Point } from '../types';
import LassoPad from './LassoPad';
import { Download, Type, PenTool, Plus, Trash2 } from 'lucide-react';

interface ControlPanelProps {
  onAddText: (text: string, size: number, weight: number) => void;
  onAddShape: (points: Point[], scale: number) => void;
  onSaveImage: () => void;
  onClearCanvas: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onAddText, onAddShape, onSaveImage, onClearCanvas }) => {
  const [mode, setMode] = useState<'text' | 'lasso'>('text');
  
  // Text State
  const [textInput, setTextInput] = useState('DIFF');
  const [fontSize, setFontSize] = useState(120);
  const [fontWeight, setFontWeight] = useState(900);

  // Lasso State
  const [currentShape, setCurrentShape] = useState<Point[] | null>(null);
  const [shapeScale, setShapeScale] = useState(1.0);

  const handleAddText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onAddText(textInput, fontSize, fontWeight);
  };

  const handleShapeComplete = (points: Point[]) => {
    setCurrentShape(points);
  };

  const handleAddShape = () => {
    if (currentShape) {
      onAddShape(currentShape, shapeScale);
      setCurrentShape(null); // Clear after adding
    }
  };

  return (
    <div className="w-full md:w-80 flex-shrink-0 bg-neutral-950 border-t md:border-t-0 md:border-r border-neutral-800 h-full flex flex-col z-20 shadow-2xl">
      <div className="p-6 border-b border-neutral-800">
        <h1 className="text-xl font-bold tracking-tighter text-white mb-1">Difference</h1>
        <p className="text-neutral-500 text-xs uppercase tracking-widest mb-3">Physics Playground</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Mode Toggles */}
        <div className="flex bg-neutral-900 p-1 rounded-lg">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'text' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Type size={16} /> Text
          </button>
          <button
            onClick={() => setMode('lasso')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'lasso' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <PenTool size={16} /> Lasso
          </button>
        </div>

        {/* Text Controls */}
        {mode === 'text' && (
          <form onSubmit={handleAddText} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase">Content</label>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-3 text-white focus:outline-none focus:border-white transition-colors"
                placeholder="Type here..."
                maxLength={20}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-neutral-400 uppercase">Size</label>
                    <span className="text-xs text-neutral-500">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="300"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-neutral-400 uppercase">Weight</label>
                    <span className="text-xs text-neutral-500">{fontWeight}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="900"
                  step="100"
                  value={fontWeight}
                  onChange={(e) => setFontWeight(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-bold py-3 px-4 rounded-md hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 active:scale-95 transform"
            >
              <Plus size={18} /> Add to Canvas
            </button>
          </form>
        )}

        {/* Lasso Controls */}
        {mode === 'lasso' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
               <label className="text-xs font-bold text-neutral-400 uppercase">Draw Shape</label>
               <LassoPad onShapeComplete={handleShapeComplete} />
            </div>

             <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-neutral-400 uppercase">Size Scale</label>
                    <span className="text-xs text-neutral-500">x{shapeScale.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={shapeScale}
                  onChange={(e) => setShapeScale(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            
            <div className="text-xs text-neutral-500 leading-relaxed">
              Draw a closed loop. Once you release, click 'Add' to drop it into the playground.
            </div>

            <button
              onClick={handleAddShape}
              disabled={!currentShape}
              className={`w-full font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 active:scale-95 transform ${
                currentShape 
                  ? 'bg-white text-black hover:bg-neutral-200' 
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Plus size={18} /> Add to Canvas
            </button>
          </div>
        )}

      </div>

      <div className="p-6 border-t border-neutral-800 bg-neutral-950 space-y-3">
        <button
            onClick={onClearCanvas}
            className="w-full border border-neutral-800 text-neutral-500 hover:text-red-500 hover:border-red-900 hover:bg-red-950/20 py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
        >
            <Trash2 size={16} /> Clear Canvas
        </button>
        <button
            onClick={onSaveImage}
            className="w-full border border-neutral-700 text-neutral-300 hover:text-white hover:border-white py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
        >
            <Download size={16} /> Save Image
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
