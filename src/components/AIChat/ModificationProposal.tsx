/**
 * Modification Proposal Component
 * 
 * Displays AI-suggested diagram modifications with accept/reject actions
 */

import { useState } from 'react';
import type { DiagramModificationProposal, DiagramOperation } from '../../types/diagram-modifications';
import styles from './ModificationProposal.module.css';

interface ModificationProposalProps {
  proposal: DiagramModificationProposal;
  onAccept: () => void;
  onReject: () => void;
}

export const ModificationProposal = ({ proposal, onAccept, onReject }: ModificationProposalProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getOperationIcon = (operation: DiagramOperation): string => {
    switch (operation.operation) {
      case 'add_node':
        return '➕';
      case 'update_node':
        return '✏️';
      case 'delete_node':
        return '🗑️';
      case 'add_link':
        return '🔗';
      case 'update_link':
        return '🔧';
      case 'delete_link':
        return '✂️';
      default:
        return '📝';
    }
  };

  const getOperationDescription = (operation: DiagramOperation): string => {
    switch (operation.operation) {
      case 'add_node':
        return `Добавить ${operation.category} "${operation.name}"`;
      case 'update_node':
        return `Обновить узел "${operation.name}"${operation.newName ? ` → "${operation.newName}"` : ''}`;
      case 'delete_node':
        return `Удалить узел "${operation.name}"`;
      case 'add_link':
        return `Добавить ${operation.linkType}${operation.name ? ` "${operation.name}"` : ''}`;
      case 'update_link':
        return `Обновить связь "${operation.name}"${operation.newName ? ` → "${operation.newName}"` : ''}`;
      case 'delete_link':
        return `Удалить связь "${operation.name}"`;
      default:
        return 'Unknown operation';
    }
  };

  return (
    <div className={styles.proposalContainer}>
      <div className={styles.proposalHeader}>
        <button 
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
        <div className={styles.proposalTitle}>
          <span className={styles.proposalIcon}>✨</span>
          <h4>Предложение по улучшению</h4>
        </div>
      </div>

      <div className={styles.proposalSummary}>
        <p>{proposal.reasoning}</p>
      </div>

      {isExpanded && (
        <div className={styles.operationsList}>
          <h5>Изменения ({proposal.operations.length}):</h5>
          {proposal.operations.map((op, index) => (
            <div key={index} className={styles.operationItem}>
              <span className={styles.operationIcon}>{getOperationIcon(op)}</span>
              <div className={styles.operationContent}>
                <div className={styles.operationDescription}>
                  {getOperationDescription(op)}
                </div>
                <div className={styles.operationReasoning}>
                  <em>{op.reasoning}</em>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.proposalActions}>
        <button 
          className={`${styles.actionButton} ${styles.acceptButton}`}
          onClick={onAccept}
        >
          ✓ Применить изменения
        </button>
        <button 
          className={`${styles.actionButton} ${styles.rejectButton}`}
          onClick={onReject}
        >
          ✗ Отклонить
        </button>
      </div>
    </div>
  );
};

