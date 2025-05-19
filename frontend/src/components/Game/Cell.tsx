import React from 'react';

export interface CellProps {
  /** X coordinate in screen pixels (center of cell) */
  x: number;
  /** Y coordinate in screen pixels (center of cell) */
  y: number;
  /** Radius of the circle in pixels */
  size: number;
  /** CSS color string */
  color: string;
}

/**
 * Renders a circular cell (player or food) as an absolutely positioned div
 * centered at (x, y) in screen pixels.
 */
export const Cell: React.FC<CellProps> = ({ x, y, size, color }) => {
  const diameter = size * 2;
  const left = x - size;
  const top = y - size;

  return (
    <div
      className="absolute rounded-full"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${diameter}px`,
        height: `${diameter}px`,
        backgroundColor: color,
      }}
    />
  );
};
