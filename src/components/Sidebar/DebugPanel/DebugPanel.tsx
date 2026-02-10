import * as go from 'gojs';
import { useAppSelector } from '../../../store/hooks';
import { normalizeLinkType } from '../../../config/diagram-rules';
import styles from './DebugPanel.module.css';

interface NodeInfo {
  name: string;
  type: string;
  id: string;
}

/**
 * DebugPanel - displays all existing links in the diagram with detailed
 * information about source and target nodes (Name, Type, ID).
 * Visible only when no node or edge is selected.
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

  /**
   * Resolve a node key to detailed info: Name, Type, ID
   */
  const getNodeInfo = (key: go.Key | null | undefined): NodeInfo => {
    if (key === null || key === undefined) {
      return { name: '—', type: '—', id: '—' };
    }
    const node = nodeDataArray.find(n => n.key === key);
    if (node) {
      return {
        name: (node.name as string) || (node.text as string) || '(no name)',
        type: (node.category as string) || 'Unknown',
        id: String(node.key),
      };
    }
    return { name: '(not found)', type: '—', id: String(key) };
  };

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
            const linkType = normalizeLinkType(link.category);
            const fromNode = getNodeInfo(link.from as go.Key | null);
            const toNode = getNodeInfo(link.to as go.Key | null);
            const linkName = (link.text as string) || '(unnamed)';
            const isFlow = linkType === 'flow';

            return (
              <div key={link.key} className={styles.linkItem}>
                {/* Link header: type badge + name + key */}
                <div className={styles.linkHeader}>
                  <span className={`${styles.linkCategory} ${isFlow ? styles.categoryFlow : styles.categoryLink}`}>
                    {linkType}
                  </span>
                  <span className={styles.linkName} title={linkName}>
                    {linkName}
                  </span>
                  {link.bidirectional && (
                    <span className={styles.bidirectionalBadge}>⇄ bi</span>
                  )}
                  <span className={styles.linkKey}>#{String(link.key)}</span>
                </div>

                {/* Connection detail: FROM → TO */}
                <div className={styles.connectionBlock}>
                  {/* FROM node */}
                  <div className={styles.nodeCard}>
                    <div className={styles.nodeCardLabel}>FROM</div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>Name:</span>
                      <span className={styles.fieldValue}>{fromNode.name}</span>
                    </div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>Type:</span>
                      <span className={styles.fieldValue}>{fromNode.type}</span>
                    </div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>ID:</span>
                      <span className={`${styles.fieldValue} ${styles.monoValue}`}>{fromNode.id}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className={styles.arrowBlock}>
                    <span className={styles.arrowSymbol}>
                      {link.bidirectional ? '⇄' : '→'}
                    </span>
                  </div>

                  {/* TO node */}
                  <div className={styles.nodeCard}>
                    <div className={styles.nodeCardLabel}>TO</div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>Name:</span>
                      <span className={styles.fieldValue}>{toNode.name}</span>
                    </div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>Type:</span>
                      <span className={styles.fieldValue}>{toNode.type}</span>
                    </div>
                    <div className={styles.nodeCardRow}>
                      <span className={styles.fieldLabel}>ID:</span>
                      <span className={`${styles.fieldValue} ${styles.monoValue}`}>{toNode.id}</span>
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
