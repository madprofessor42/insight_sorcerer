import { useEffect, useRef, useState, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  disabled?: boolean;
  initialPosition?: Position;
  bounds?: 'parent' | 'window';
}

export const useDraggable = (options: UseDraggableOptions = {}) => {
  const { disabled = false, initialPosition = { x: 0, y: 0 }, bounds = 'window' } = options;

  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<Position>({ x: 0, y: 0 });
  const offsetRef = useRef<Position>({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (disabled || !dragRef.current || !handleRef.current) return;
      
      // Check if click is on the handle
      if (!handleRef.current.contains(e.target as Node)) return;

      e.preventDefault();
      setIsDragging(true);

      const rect = dragRef.current.getBoundingClientRect();
      startPosRef.current = { x: rect.left, y: rect.top };
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [disabled]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      e.preventDefault();

      let newX = e.clientX - offsetRef.current.x;
      let newY = e.clientY - offsetRef.current.y;

      // Apply bounds
      if (bounds === 'window') {
        const rect = dragRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
      }

      setPosition({ x: newX, y: newY });
    },
    [isDragging, bounds]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (disabled) return;

    const handle = handleRef.current;
    const drag = dragRef.current;
    if (!handle || !drag) return;

    handle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      handle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [disabled, handleMouseDown, handleMouseMove, handleMouseUp, handleRef.current, dragRef.current]);

  const resetPosition = useCallback(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  return {
    dragRef,
    handleRef,
    position,
    isDragging,
    resetPosition,
  };
};

