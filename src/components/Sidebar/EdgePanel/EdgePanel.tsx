import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useEdgeOperations } from '../../../hooks/useEdgeOperations';
import styles from './EdgePanel.module.css';

export function EdgePanel() {
  const selectedEdge = useAppSelector((state) => state.diagram.selectedEdge);
  const { resetCurve, reverseDirection, toggleBidirectional } = useEdgeOperations();
  const [bidirectionalActive, setBidirectionalActive] = useState(false);

  // Update bidirectional state when selected edge changes
  useEffect(() => {
    if (selectedEdge) {
      setBidirectionalActive(selectedEdge.bidirectional === true);
    }
  }, [selectedEdge]);

  if (!selectedEdge) {
    return null;
  }

  const handleToggleBidirectional = () => {
    toggleBidirectional(selectedEdge);
    setBidirectionalActive(!bidirectionalActive);
  };

  return (
    <section className={styles.edgePanel}>
      {/* Edge Info */}
      <div className={styles.edgeInfo}>
        <p className={styles.edgeType}>
          Тип: {selectedEdge.category || 'link'}
        </p>
        {selectedEdge.key && (
          <p className={styles.edgeId}>
            ID: {selectedEdge.key}
          </p>
        )}
      </div>

      {/* Edge Actions */}
      <div className={styles.edgeActions}>
        <button
          className={styles.edgeActionButton}
          onClick={() => resetCurve(selectedEdge)}
          title="Сбросить изгиб связи"
        >
          <span className={styles.edgeActionIcon}>🔄</span>
          <span className={styles.edgeActionLabel}>Сбросить изгиб</span>
        </button>

        <button
          className={styles.edgeActionButton}
          onClick={() => reverseDirection(selectedEdge)}
          title="Развернуть направление связи"
        >
          <span className={styles.edgeActionIcon}>↔️</span>
          <span className={styles.edgeActionLabel}>Развернуть</span>
        </button>

        <button
          className={`${styles.edgeActionButton} ${bidirectionalActive ? styles.active : ''}`}
          onClick={handleToggleBidirectional}
          title="Переключить двунаправленность"
        >
          <span className={styles.edgeActionIcon}>⇄</span>
          <span className={styles.edgeActionLabel}>Двунаправленная</span>
        </button>
      </div>
    </section>
  );
}

