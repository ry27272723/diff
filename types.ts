
export interface Point {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
  rotation: number;
}

export type EntityType = 'text' | 'shape';

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  rotation: number;
  velocity: Velocity;
  
  // Physics properties
  width: number;
  height: number;
  isDragging: boolean;
  isStatic: boolean; // If true, unaffected by gravity (while dragging)

  // Text specific
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;

  // Shape specific
  points?: Point[]; // Relative to x,y (center)
}

export interface CanvasDimensions {
  width: number;
  height: number;
}
