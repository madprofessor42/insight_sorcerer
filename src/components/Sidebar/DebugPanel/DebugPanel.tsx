import { useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { resolveLinkInfo, isEdgeEndpoint } from '../../../utils/diagram-data';
import type { ConnectionEndpointInfo } from '../../../utils/diagram-data';
import styles from './DebugPanel.module.css';

/**
 * Helper to get the label for connection card header.
 * Shows "FROM (Edge)" or "TO (Edge)" when endpoint is an edge.
 */
function getEndpointLabel(prefix: string, endpoint: ConnectionEndpointInfo): string {
  if (isEdgeEndpoint(endpoint)) {
    return `${prefix} (Edge)`;
  }
  return prefix;
}

/**
 * DebugPanel - displays all existing links in the diagram with detailed
 * information about source and target endpoints (nodes or edges).
 * Visible only when no node or edge is selected.
 *
 * When a link connects to an edge (via LinkLabel), it transparently
 * shows the parent edge info instead of "LinkLabel".
 *
 * All styling is config-driven via link color from LINK_CONFIGURATIONS.
 */
export function DebugPanel() {
  const selectedNodeKey = useAppSelector((state) => state.diagram.selectedNodeKey);
  const selectedEdgeKey = useAppSelector((state) => state.diagram.selectedEdgeKey);
  const linkDataArray = useAppSelector((state) => state.diagram.linkDataArray);
  const nodeDataArray = useAppSelector((state) => state.diagram.nodeDataArray);
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show when nothing is selected
  if (selectedNodeKey !== null || selectedEdgeKey !== null) {
    return null;
  }

  return (
    <section className={styles.debugPanel}>
      {/* Header */}
      <div className={styles.debugHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className={styles.debugTitle}>Debug Links</h2>
        <span className={styles.badge}>{linkDataArray.length}</span>
        <button
          className={styles.toggleButton}
          title={isExpanded ? 'Свернуть' : 'Развернуть'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Links list */}
      {isExpanded && (
        <div className={styles.content}>
          {linkDataArray.length === 0 ? (
            <p className={styles.emptyState}>Нет связей</p>
          ) : (
            <>
              <h4 className={styles.listHeader}>Список связей</h4>
              <div className={styles.linkList}>
          {linkDataArray.map((link) => {
            // Pass linkDataArray for edge-to-edge resolution
            const info = resolveLinkInfo(link, nodeDataArray, linkDataArray);

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
                  {/* FROM endpoint (node or edge) */}
                  <div className={styles.nodeCard}>
                    <div className={styles.nodeCardLabel}>
                      {getEndpointLabel('FROM', info.from)}
                    </div>
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

                  {/* TO endpoint (node or edge) */}
                  <div className={styles.nodeCard}>
                    <div className={styles.nodeCardLabel}>
                      {getEndpointLabel('TO', info.to)}
                    </div>
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
            </>
          )}
        </div>
      )}
    </section>
  );
}
