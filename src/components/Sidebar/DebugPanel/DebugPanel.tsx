import { useAppSelector } from '../../../store/hooks';
import { resolveLinkInfo } from '../../../utils/diagram-data';
import styles from './DebugPanel.module.css';

/**
 * DebugPanel - displays all existing links in the diagram with detailed
 * information about source and target nodes (Name, Type, ID).
 * Visible only when no node or edge is selected.
 * 
 * All styling is config-driven via link color from LINK_CONFIGURATIONS.
 */
export function DebugPanel() {
  const selectedNodeKey = useAppSelector((state) => state.diagram.selectedNodeKey);
  const selectedEdgeKey = useAppSelector((state) => state.diagram.selectedEdgeKey);
  const linkDataArray = useAppSelector((state) => state.diagram.linkDataArray);
  const nodeDataArray = useAppSelector((state) => state.diagram.nodeDataArray);

  // Only show when nothing is selected
  if (selectedNodeKey !== null || selectedEdgeKey !== null) {
    return null;
  }

  return (
    <section className={styles.debugPanel}>
      {/* Header */}
      <div className={styles.debugHeader}>
        <span className={styles.debugIcon}>🔗</span>
        <h2 className={styles.debugTitle}>Debug: Links</h2>
        <span className={styles.badge}>{linkDataArray.length}</span>
      </div>

      {/* Links list */}
      {linkDataArray.length === 0 ? (
        <p className={styles.emptyState}>No links created yet</p>
      ) : (
        <div className={styles.linkList}>
          {linkDataArray.map((link) => {
            const info = resolveLinkInfo(link, nodeDataArray);

            // Dynamic badge style from link config color
            const categoryStyle = {
              background: `${info.color}33`, // 20% opacity
              color: info.color,
              borderColor: `${info.color}4D`, // 30% opacity
            };

            return (
              <div key={link.key} className={styles.linkItem}>
                {/* Link header: type badge + name + key */}
                <div className={styles.linkHeader}>
                  <span className={styles.linkCategory} style={categoryStyle}>
                    {info.label}
                  </span>
                  <span className={styles.linkName} title={info.name}>
                    {info.name}
                  </span>
                  {info.isBidirectional && (
                    <span className={styles.bidirectionalBadge}>⇄ bi</span>
                  )}
                  <span className={styles.linkKey}>#{info.id}</span>
                </div>

                {/* Connection detail: FROM → TO */}
                <div className={styles.connectionBlock}>
                  {/* FROM node */}
                  <div className={styles.nodeCard}>
                    <div className={styles.nodeCardLabel}>FROM</div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>Name:</span>
                      <span className={styles.fieldValue}>{info.from.name}</span>
                    </div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>Type:</span>
                      <span className={styles.fieldValue}>{info.from.type}</span>
                    </div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>ID:</span>
                      <span className={`${styles.fieldValue} ${styles.monoValue}`}>{info.from.id}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className={styles.arrowBlock}>
                    <span className={styles.arrowSymbol}>
                      {info.directionSymbol}
                    </span>
                  </div>

                  {/* TO node */}
                  <div className={styles.nodeCard}>
                    <div className={styles.nodeCardLabel}>TO</div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>Name:</span>
                      <span className={styles.fieldValue}>{info.to.name}</span>
                    </div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>Type:</span>
                      <span className={styles.fieldValue}>{info.to.type}</span>
                    </div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>ID:</span>
                      <span className={`${styles.fieldValue} ${styles.monoValue}`}>{info.to.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
