import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setLinkType } from '../../store/diagramSlice';
import { usePaletteDragDrop } from '../../hooks/palette/usePaletteDragDrop';
import { NodePanel } from './NodePanel/NodePanel';
import { EdgePanel } from './EdgePanel';
import { DebugPanel } from './DebugPanel';
import { DiagramStorage } from './DiagramStorage';
import { LINK_CONFIGURATIONS, NODE_CONFIGURATIONS } from '../../config/diagram-rules';
import styles from './Sidebar.module.css';

const MIN_WIDTH = 220;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 260;

export function Sidebar() {
  const dispatch = useAppDispatch();
  const selectedLinkType = useAppSelector((state) => state.diagram.selectedLinkType);
  const { handleDragStart } = usePaletteDragDrop();

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const delta = e.clientX - startXRef.current;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
    setWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <aside className={styles.sidebar} style={{ width }}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>System Dynamics</h1>
        <p className={styles.subtitle}>Visual Modeler</p>
      </header>

      {/* Diagram Storage Section */}
      <DiagramStorage />

      {/* Node Components Section - Dynamic from configuration */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Primitives</h2>
        <div className={styles.nodeList}>
          {NODE_CONFIGURATIONS.filter(config => config.manuallyCreatable).map((config) => (
            <div
              key={config.id}
              className={styles.nodeCard}
              draggable
              onDragStart={(e) => handleDragStart(e, config.id, { 
                category: config.id, 
                name: config.style.defaultText || config.label
              })}
            >
              <div className={styles.nodeIcon}>
                <div 
                  className={styles[`${config.id.toLowerCase()}Icon`]} 
                  style={{
                    backgroundColor: config.style.fill,
                    borderColor: config.style.stroke
                  }}
                />
              </div>
              <div className={styles.nodeInfo}>
                <p className={styles.nodeName}>{config.label}</p>
                <p className={styles.nodeDescription}>{config.description || ''}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Link Type Section - Dynamic from configuration */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Connection Type</h2>
        <div className={styles.linkTypeButtons}>
          {LINK_CONFIGURATIONS.map((config) => (
            <button
              key={config.id}
              className={`${styles.linkTypeButton} ${selectedLinkType === config.id ? styles.active : ''}`}
              onClick={() => dispatch(setLinkType(config.id))}
              title={config.ui.description}
            >
              <div className={`${styles.linkPreview} ${styles[config.ui.previewClassName]}`}>
                <div className={styles[`${config.id}Line`]} />
                <div className={styles[`${config.id}Arrow`]} />
              </div>
              <span className={styles.linkLabel}>{config.ui.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Node Options Panel - shown when node is selected */}
      <NodePanel />

      {/* Edge Options Panel - shown when edge is selected */}
      <EdgePanel />

      {/* Debug Panel - shown when nothing is selected */}
      <DebugPanel />

      {/* Resize handle */}
      <div
        className={`${styles.resizeHandle} ${isResizing ? styles.resizeHandleActive : ''}`}
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
}
