/**
 * DataPointsTableInput - Editable table for converter data points.
 * 
 * Allows users to edit converter data points in a table format (x, y pairs).
 * Supports adding, removing, and editing rows.
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { parseDataPoints, formatDataPoints, type DataPoint } from '../../utils/simulation';
import styles from './DataPointsTableInput.module.css';

export interface DataPointsTableInputProps {
  id: string;
  label: string;
  value: string; // Format: "x1,y1;x2,y2;..."
  onChange: (value: string) => void;
  placeholder?: string;
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
  const [tempEditValue, setTempEditValue] = useState<string>('');
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
    // Allow empty input during editing
    setTempEditValue(newValue);
    
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) return; // Don't update dataPoints yet if invalid

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

  const handleCellBlur = useCallback((rowIndex: number, col: 'x' | 'y') => {
    // If the temp value is empty or invalid, restore the previous value
    const numValue = parseFloat(tempEditValue);
    if (tempEditValue === '' || isNaN(numValue)) {
      // Value was cleared or invalid - dataPoints already has the correct value
      // Just close the editor
      setEditingCell(null);
      setTempEditValue('');
      return;
    }
    
    // Valid value - make sure it's committed
    const updated = [...dataPoints];
    updated[rowIndex] = { ...updated[rowIndex], [col]: numValue };
    setDataPoints(updated);
    
    const formatted = formatDataPoints(updated);
    isInternalUpdateRef.current = true;
    prevValueRef.current = formatted;
    onChange(formatted);
    
    setEditingCell(null);
    setTempEditValue('');
  }, [tempEditValue, dataPoints, onChange]);

  const handleCellClick = useCallback((rowIndex: number, col: 'x' | 'y') => {
    setEditingCell({ row: rowIndex, col });
    // Set initial temp value
    setTempEditValue(String(dataPoints[rowIndex][col]));
  }, [dataPoints]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, col: 'x' | 'y') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellBlur(rowIndex, col);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Cancel editing and restore original value
      setEditingCell(null);
      setTempEditValue('');
    }
  }, [handleCellBlur]);

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
                      type="text"
                      className={styles.cellInput}
                      value={tempEditValue}
                      onChange={(e) => handleCellChange(rowIndex, 'x', e.target.value)}
                      onBlur={() => handleCellBlur(rowIndex, 'x')}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 'x')}
                      autoFocus
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
                      type="text"
                      className={styles.cellInput}
                      value={tempEditValue}
                      onChange={(e) => handleCellChange(rowIndex, 'y', e.target.value)}
                      onBlur={() => handleCellBlur(rowIndex, 'y')}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 'y')}
                      autoFocus
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

