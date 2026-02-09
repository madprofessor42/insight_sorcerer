import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setLinkType } from '../../store/diagramSlice';
import { usePaletteDragDrop } from '../../hooks/palette/usePaletteDragDrop';
import { EdgePanel } from './EdgePanel';
import { LINK_CONFIGURATIONS } from '../../config/diagram-rules';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const dispatch = useAppDispatch();
  const selectedLinkType = useAppSelector((state) => state.diagram.selectedLinkType);
  const { handleDragStart } = usePaletteDragDrop();

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>System Dynamics</h1>
        <p className={styles.subtitle}>Visual Modeler</p>
      </header>

      {/* Node Components Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Primitives</h2>
        <div className={styles.nodeList}>
          {/* Stock Node */}
          <div
            className={styles.nodeCard}
            draggable
            onDragStart={(e) => handleDragStart(e, 'Stock', { 
              category: 'Stock', 
              name: 'Stock' 
            })}
          >
            <div className={styles.nodeIcon}>
              <div className={styles.stockIcon} />
            </div>
            <div className={styles.nodeInfo}>
              <p className={styles.nodeName}>Stock</p>
              <p className={styles.nodeDescription}>Accumulator - stores quantities</p>
            </div>
          </div>
          
          {/* Variable Node */}
          <div
            className={styles.nodeCard}
            draggable
            onDragStart={(e) => handleDragStart(e, 'Variable', { 
              category: 'Variable', 
              name: 'Variable' 
            })}
          >
            <div className={styles.nodeIcon}>
              <div className={styles.variableIcon} />
            </div>
            <div className={styles.nodeInfo}>
              <p className={styles.nodeName}>Variable</p>
              <p className={styles.nodeDescription}>Formula or constant value</p>
            </div>
          </div>
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

      {/* Edge Options Panel - shown when edge is selected */}
      <EdgePanel />
    </aside>
  );
}
