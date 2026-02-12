/**
 * DataPointsTableInput - Editable table for converter data points.
 * 
 * Allows users to edit converter data points in a table format (x, y pairs).
 * Supports adding, removing, and editing rows.
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import styles from './DataPointsTableInput.module.css';

export interface DataPoint {
  x: number;
  y: number;
}

export interface DataPointsTableInputProps {
  id: string;
  label: string;
  value: string; // Format: "x1,y1;x2,y2;..."
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Parse string value to array of data points.
 */
function parseDataPoints(value: string): DataPoint[] {
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
 */
function formatDataPoints(points: DataPoint[]): string {
  return points.map(p => `${p.x},${p.y}`).join(';');
}

/**
 * Editable table component for converter data points.
 */
export function DataPointsTableInput({
  id,
  label,
  value,
  onChange,
  placeholder = '0,0;1,1;2,2'
}: DataPointsTableInputProps) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(() => parseDataPoints(value));
  const [editingCell, setEditingCell] = useState<{ row: number; col: 'x' | 'y' } | null>(null);
  const isInternalUpdateRef = useRef(false);
  const prevValueRef = useRef(value);

  // Sync internal state with external value changes (e.g., when selecting different node)
  // Only update if the change came from outside (not from our own updates)
  useEffect(() => {
    if (!isInternalUpdateRef.current && value !== prevValueRef.current) {
      const parsed = parseDataPoints(value);
      setDataPoints(parsed);
      prevValueRef.current = value;
    }
    isInternalUpdateRef.current = false;
  }, [value]);

  const handleCellChange = useCallback((rowIndex: number, col: 'x' | 'y', newValue: string) => {
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) return;

    const updated = [...dataPoints];
    updated[rowIndex] = { ...updated[rowIndex], [col]: numValue };
    setDataPoints(updated);
    
    // Call onChange after state update, not inside setState
    const formatted = formatDataPoints(updated);
    isInternalUpdateRef.current = true;
    prevValueRef.current = formatted;
    onChange(formatted);
  }, [dataPoints, onChange]);

  const handleAddRow = useCallback(() => {
    // Add new point with x = last x + 1, y = last y
    const lastPoint = dataPoints[dataPoints.length - 1] || { x: 0, y: 0 };
    const newPoint = { x: lastPoint.x + 1, y: lastPoint.y };
    const updated = [...dataPoints, newPoint];
    setDataPoints(updated);
    
    // Call onChange after state update, not inside setState
    const formatted = formatDataPoints(updated);
    isInternalUpdateRef.current = true;
    prevValueRef.current = formatted;
    onChange(formatted);
  }, [dataPoints, onChange]);

  const handleRemoveRow = useCallback((rowIndex: number) => {
    if (dataPoints.length <= 1) {
      // Don't allow removing the last row
      return;
    }
    
    const updated = dataPoints.filter((_, i) => i !== rowIndex);
    setDataPoints(updated);
    
    // Call onChange after state update, not inside setState
    const formatted = formatDataPoints(updated);
    isInternalUpdateRef.current = true;
    prevValueRef.current = formatted;
    onChange(formatted);
  }, [dataPoints, onChange]);

  const handleCellBlur = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleCellClick = useCallback((rowIndex: number, col: 'x' | 'y') => {
    setEditingCell({ row: rowIndex, col });
  }, []);

  return (
    <div className={styles.container}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.headerCell}>X (Input)</th>
              <th className={styles.headerCell}>Y (Output)</th>
              <th className={styles.headerCellActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dataPoints.map((point, rowIndex) => (
              <tr key={rowIndex} className={styles.row}>
                <td className={styles.cell}>
                  {editingCell?.row === rowIndex && editingCell?.col === 'x' ? (
                    <input
                      type="number"
                      className={styles.cellInput}
                      value={point.x}
                      onChange={(e) => handleCellChange(rowIndex, 'x', e.target.value)}
                      onBlur={handleCellBlur}
                      autoFocus
                      step="any"
                    />
                  ) : (
                    <div
                      className={styles.cellDisplay}
                      onClick={() => handleCellClick(rowIndex, 'x')}
                    >
                      {point.x}
                    </div>
                  )}
                </td>
                <td className={styles.cell}>
                  {editingCell?.row === rowIndex && editingCell?.col === 'y' ? (
                    <input
                      type="number"
                      className={styles.cellInput}
                      value={point.y}
                      onChange={(e) => handleCellChange(rowIndex, 'y', e.target.value)}
                      onBlur={handleCellBlur}
                      autoFocus
                      step="any"
                    />
                  ) : (
                    <div
                      className={styles.cellDisplay}
                      onClick={() => handleCellClick(rowIndex, 'y')}
                    >
                      {point.y}
                    </div>
                  )}
                </td>
                <td className={styles.cellActions}>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemoveRow(rowIndex)}
                    disabled={dataPoints.length <= 1}
                    title="Remove row"
                    aria-label="Remove row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className={styles.addButton}
        onClick={handleAddRow}
      >
        + Add Data Point
      </button>

      {placeholder && dataPoints.length === 1 && dataPoints[0].x === 0 && dataPoints[0].y === 0 && (
        <p className={styles.hint}>
          Hint: {placeholder}
        </p>
      )}
    </div>
  );
}

