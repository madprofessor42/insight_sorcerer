import { useAppSelector } from '../../store/hooks';
import { usePaletteDragDrop } from '../../hooks/usePaletteDragDrop';
import { useLinkTypeSelector } from '../../hooks/useLinkTypeSelector';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const selectedLinkType = useAppSelector((state) => state.diagram.selectedLinkType);
  const { handleDragStart } = usePaletteDragDrop();
  const { handleLinkTypeChange } = useLinkTypeSelector();

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

      {/* Link Type Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Connection Type</h2>
        <div className={styles.linkTypeButtons}>
          {/* Flow Type Button */}
          <button
            className={`${styles.linkTypeButton} ${selectedLinkType === 'flow' ? styles.active : ''}`}
            onClick={() => handleLinkTypeChange('flow')}
          >
            <div className={`${styles.linkPreview} ${styles.flowStyle}`}>
              <div className={styles.flowLine} />
              <div className={styles.flowArrow} />
            </div>
            <span className={styles.linkLabel}>Flow</span>
          </button>
          
          {/* Link Type Button */}
          <button
            className={`${styles.linkTypeButton} ${selectedLinkType === 'link' ? styles.active : ''}`}
            onClick={() => handleLinkTypeChange('link')}
          >
            <div className={`${styles.linkPreview} ${styles.linkStyle}`}>
              <div className={styles.linkLine} />
              <div className={styles.linkArrow} />
            </div>
            <span className={styles.linkLabel}>Link</span>
          </button>
        </div>
      </section>
    </aside>
  );
}
