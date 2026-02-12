/**
 * Converter Data Point Utilities
 * Pure functions for parsing and formatting converter data points
 */

export interface DataPoint {
  x: number;
  y: number;
}

/**
 * Parse string value to array of data points.
 * Format: "x1,y1;x2,y2;x3,y3;..."
 * 
 * @param value - String representation of data points
 * @returns Array of parsed data points, or default [{x:0, y:0}] if invalid
 * 
 * @example
 * parseDataPoints("0,0;1,10;2,20") // => [{x:0,y:0}, {x:1,y:10}, {x:2,y:20}]
 * parseDataPoints("") // => [{x:0,y:0}]
 * parseDataPoints("invalid") // => [{x:0,y:0}]
 */
export function parseDataPoints(value: string): DataPoint[] {
  if (!value || typeof value !== 'string') {
    return [{ x: 0, y: 0 }];
  }
  
  try {
    const points = value.split(';').map(pair => {
      const [x, y] = pair.trim().split(',').map(v => parseFloat(v.trim()));
      if (isNaN(x) || isNaN(y)) {
        throw new Error(`Invalid data point: ${pair}`);
      }
      return { x, y };
    });
    return points.length > 0 ? points : [{ x: 0, y: 0 }];
  } catch (error) {
    console.warn('Failed to parse data points:', error);
    return [{ x: 0, y: 0 }];
  }
}

/**
 * Convert array of data points to string format.
 * Format: "x1,y1;x2,y2;x3,y3;..."
 * 
 * @param points - Array of data points to format
 * @returns String representation of data points
 * 
 * @example
 * formatDataPoints([{x:0,y:0}, {x:1,y:10}]) // => "0,0;1,10"
 */
export function formatDataPoints(points: DataPoint[]): string {
  return points.map(p => `${p.x},${p.y}`).join(';');
}

