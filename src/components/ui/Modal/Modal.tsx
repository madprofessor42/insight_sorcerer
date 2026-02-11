/**
 * Modal component - reusable popup/overlay.
 * 
 * Clean, accessible modal following best practices.
 */

import { useEffect, useCallback, type ReactNode } from 'react';
import styles from './Modal.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnBackdropClick?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'large',
  closeOnBackdropClick = true 
}: ModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Close on backdrop click (if enabled)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={`${styles.modal} ${styles[size]}`}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

