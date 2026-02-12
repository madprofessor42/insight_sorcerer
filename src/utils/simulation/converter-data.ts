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

/**
 * Generate default converter values based on simulation time settings.
 * Creates 3 data points:
 * - Start: timeStart
 * - Middle: timeStart + timeLength/2
 * - End: timeStart + timeLength
 * 
 * Output values are placeholder values (30, 10, 100).
 * 
 * @param timeStart - Simulation start time
 * @param timeLength - Simulation length
 * @returns String representation of default data points
 * 
 * @example
 * generateDefaultConverterValues(2000, 100) // => "2000,30;2050,10;2100,100"
 * generateDefaultConverterValues(2000, 1) // => "2000,30;2000.5,10;2001,100"
 * generateDefaultConverterValues(2000, 0.1) // => "2000,30;2000.05,10;2000.1,100"
 */
export function generateDefaultConverterValues(timeStart: number, timeLength: number): string {
  const start = timeStart;
  const middle = timeStart + timeLength / 2;
  const end = timeStart + timeLength;
  
  return formatDataPoints([
    { x: start, y: 10 },
    { x: middle, y: 30 },
    { x: end, y: 100 }
  ]);
}

