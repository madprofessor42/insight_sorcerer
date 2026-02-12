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
 * Sort data points by X in ascending order.
 */
function sortDataPointsByX(points: DataPoint[]): DataPoint[] {
  return [...points].sort((a, b) => a.x - b.x);
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
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(() => sortDataPointsByX(parseDataPoints(value)));
  const [editingCell, setEditingCell] = useState<{ row: number; col: 'x' | 'y' } | null>(null);
  const [tempEditValue, setTempEditValue] = useState<string>('');
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  const isInternalUpdateRef = useRef(false);
  const prevValueRef = useRef(value);

  // Sync internal state with external value changes (e.g., when selecting different node)
  // Only update if the change came from outside (not from our own updates)
  useEffect(() => {
    if (!isInternalUpdateRef.current && value !== prevValueRef.current) {
      const parsed = sortDataPointsByX(parseDataPoints(value));
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
    // Add new point with x = max x + 1, y = last y (after sorting)
    const sorted = sortDataPointsByX(dataPoints);
    const lastPoint = sorted[sorted.length - 1] || { x: 0, y: 0 };
    const newPoint = { x: lastPoint.x + 1, y: lastPoint.y };
    const updated = sortDataPointsByX([...dataPoints, newPoint]);
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

  const handleDragStart = useCallback((e: React.DragEvent, rowIndex: number) => {
    setDraggedRow(rowIndex);
    // Set drag image to be slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, rowIndex: number) => {
    e.preventDefault();
    
    if (draggedRow === null || draggedRow === rowIndex) {
      return;
    }
    
    // Dynamically reorder items during drag
    const updated = [...dataPoints];
    const [draggedItem] = updated.splice(draggedRow, 1);
    updated.splice(rowIndex, 0, draggedItem);
    
    setDataPoints(updated);
    setDraggedRow(rowIndex); // Update dragged row index after reordering
  }, [draggedRow, dataPoints]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Save final state
    if (draggedRow !== null) {
      const formatted = formatDataPoints(dataPoints);
      isInternalUpdateRef.current = true;
      prevValueRef.current = formatted;
      onChange(formatted);
    }
    
    setDraggedRow(null);
  }, [draggedRow, dataPoints, onChange]);

  const handleDragEnd = useCallback(() => {
    // Save final state on drag end (in case drop wasn't triggered)
    if (draggedRow !== null) {
      const formatted = formatDataPoints(dataPoints);
      isInternalUpdateRef.current = true;
      prevValueRef.current = formatted;
      onChange(formatted);
    }
    
    setDraggedRow(null);
  }, [draggedRow, dataPoints, onChange]);

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
    
    // Sort by X if X column was changed
    const sorted = col === 'x' ? sortDataPointsByX(updated) : updated;
    setDataPoints(sorted);
    
    const formatted = formatDataPoints(sorted);
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
              <th className={styles.headerCellDrag}></th>
              <th className={styles.headerCell}>X (Input)</th>
              <th className={styles.headerCell}>Y (Output)</th>
              <th className={styles.headerCellActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dataPoints.map((point, rowIndex) => (
              <tr 
                key={`${point.x}-${point.y}-${rowIndex}`}
                className={`${styles.row} ${draggedRow === rowIndex ? styles.rowDragging : ''}`}
                draggable={editingCell === null}
                onDragStart={(e) => handleDragStart(e, rowIndex)}
                onDragOver={(e) => handleDragOver(e, rowIndex)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              >
                <td className={styles.cellDrag}>
                  <div className={styles.dragHandle} title="Drag to reorder">
                    ⋮⋮
                  </div>
                </td>
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

