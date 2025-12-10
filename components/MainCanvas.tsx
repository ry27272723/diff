
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Entity, Point, EntityType } from '../types';
import * as C from '../constants';
import { initAudio, playImpact, playPlacement } from '../utils/sound';

interface MainCanvasProps {
  entities: Entity[];
  setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const MainCanvas: React.FC<MainCanvasProps> = ({ entities, setEntities, canvasRef }) => {
  const requestRef = useRef<number>();
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  
  // Use a ref for entities inside the animation loop to avoid dependency staleness without re-triggering effects
  const entitiesRef = useRef<Entity[]>(entities);

  // Sync ref with props
  useEffect(() => {
    entitiesRef.current = entities;
  }, [entities]);

  const updatePhysics = (width: number, height: number) => {
    const updatedEntities = entitiesRef.current.map(entity => {
      // Skip physics if dragging or if the entity is static (fixed to canvas)
      if (entity.isDragging || entity.isStatic) {
        return { ...entity, velocity: { x: 0, y: 0, rotation: 0 } };
      }

      let { x, y, velocity, rotation } = entity;
      let { x: vx, y: vy, rotation: vRot } = velocity;

      // Gravity
      const gravity = C.GRAVITY;
      vy += gravity;
      
      // Air Resistance
      vx *= C.AIR_RESISTANCE;
      vy *= C.AIR_RESISTANCE;
      vRot *= 0.98; // Rotation friction

      // Apply Velocity
      x += vx;
      y += vy;
      rotation += vRot;

      // Floor Collision
      const bottomBound = height - entity.height / 2; // Approximate center origin
      if (y > bottomBound) {
        // Trigger sound if hitting floor with sufficient velocity
        if (vy > 2) {
            playImpact(vy);
        }

        y = bottomBound;
        vy *= -C.BOUNCE_FACTOR;
        vx *= C.FLOOR_FRICTION; // Friction when sliding on floor
        vRot *= 0.8;
        
        // Stop micro-bouncing
        if (Math.abs(vy) < gravity) vy = 0;
      }

      // Wall Collision (Left/Right)
      const halfWidth = entity.width / 2;
      if (x < halfWidth) {
        x = halfWidth;
        vx *= -C.BOUNCE_FACTOR;
      } else if (x > width - halfWidth) {
        x = width - halfWidth;
        vx *= -C.BOUNCE_FACTOR;
      }

      return {
        ...entity,
        x,
        y,
        rotation,
        velocity: { x: vx, y: vy, rotation: vRot }
      };
    });

    entitiesRef.current = updatedEntities;
    setEntities(updatedEntities); // Sync back to React state for other consumers if needed
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 1. Clear background (Must be black)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = C.CANVAS_BG;
    ctx.fillRect(0, 0, width, height);

    // 2. Set Difference Mode
    // Key Concept: Difference against Black (0) results in the Color Value.
    // White (255) - Black (0) = White.
    // Overlap: White (255) - White (255) = Black (0).
    ctx.globalCompositeOperation = 'difference';

    entitiesRef.current.forEach(entity => {
      ctx.save();
      ctx.translate(entity.x, entity.y);
      ctx.rotate(entity.rotation);
      
      ctx.fillStyle = C.ENTITY_COLOR;

      if (entity.type === 'text' && entity.text) {
        ctx.font = `${entity.fontWeight} ${entity.fontSize}px ${entity.fontFamily || C.DEFAULT_FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(entity.text, 0, 0);
      } else if (entity.type === 'shape' && entity.points) {
        ctx.beginPath();
        if (entity.points.length > 0) {
          ctx.moveTo(entity.points[0].x, entity.points[0].y);
          for (let i = 1; i < entity.points.length; i++) {
            ctx.lineTo(entity.points[i].x, entity.points[i].y);
          }
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });
  };

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    // We assume the canvas width/height attributes are set by the resize listener or parent
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    updatePhysics(width, height);
    draw(ctx, width, height);

    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Shared Hit Test Logic
  const getHitEntity = (clientX: number, clientY: number, currentEntities: Entity[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Hit Test - Check top-most first (reverse iteration)
    // Simple AABB approximation for hit testing rotated objects for smoother UX
    const entity = [...currentEntities].reverse().find(ent => {
      // Distance check is often better for loose shapes than strict bounding boxes
      const dx = Math.abs(x - ent.x);
      const dy = Math.abs(y - ent.y);
      return dx < ent.width / 2 && dy < ent.height / 2;
    });

    return { entity, x, y };
  };

  // Input Handling for Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    // Initialize audio context on first user interaction
    initAudio();

    const hit = getHitEntity(e.clientX, e.clientY, entitiesRef.current);

    if (hit && hit.entity) {
      draggingRef.current = {
        id: hit.entity.id,
        offsetX: hit.x - hit.entity.x,
        offsetY: hit.y - hit.entity.y
      };
      
      // Mark entity as dragging
      const updated = entitiesRef.current.map(ent => 
        ent.id === hit.entity!.id ? { ...ent, isDragging: true, velocity: { x: 0, y: 0, rotation: 0 } } : ent
      );
      entitiesRef.current = updated;
      setEntities(updated);
      
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const updated = entitiesRef.current.map(ent => {
      if (ent.id === draggingRef.current?.id) {
        return {
          ...ent,
          x: x - draggingRef.current.offsetX,
          y: y - draggingRef.current.offsetY,
          velocity: { x: 0, y: 0, rotation: 0 } // Kill velocity while holding
        };
      }
      return ent;
    });
    
    entitiesRef.current = updated;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;

    // On release, set isDragging to false, and isStatic to TRUE to fix it in place
    const updated = entitiesRef.current.map(ent => 
      ent.id === draggingRef.current?.id ? { ...ent, isDragging: false, isStatic: true } : ent
    );
    entitiesRef.current = updated;
    setEntities(updated);
    
    // Play placement sound
    playPlacement();
    
    draggingRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Resize Observer to keep canvas sharp
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    });
    
    resizeObserver.observe(canvas.parentElement!);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="flex-1 relative bg-black overflow-hidden cursor-move">
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};

export default MainCanvas;
