/**
 * Modal component - reusable popup/overlay.
 * 
 * Clean, accessible modal following best practices.
 * Supports dragging and minimizing.
 */

import { useEffect, useCallback, type ReactNode } from 'react';
import { useDraggable } from '../../../hooks/ui';
import styles from './Modal.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnBackdropClick?: boolean;
  draggable?: boolean;
  minimizable?: boolean;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  windowId?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'large',
  closeOnBackdropClick = true,
  draggable = false,
  minimizable = false,
  isMinimized = false,
  onMinimize,
}: ModalProps) {
  // Calculate center position for draggable modals - memoize based on size and window size
  const centerPosition = useCallback(() => {
    const modalWidth = size === 'small' ? 400 : size === 'medium' ? 600 : 800;
    const modalHeight = 600; // approximate
    return {
      x: Math.max(0, (window.innerWidth - modalWidth) / 2),
      y: Math.max(0, (window.innerHeight - modalHeight) / 2),
    };
  }, [size]);

  const { dragRef, handleRef, position, isDragging } = useDraggable({
    disabled: !draggable || isMinimized,
    initialPosition: draggable ? centerPosition() : { x: 0, y: 0 },
  });

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMinimized) {
        onClose();
      }
    },
    [onClose, isMinimized]
  );

  useEffect(() => {
    if (isOpen && !isMinimized) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isMinimized, handleKeyDown]);

  if (!isOpen) return null;
  
  // Don't render content when minimized (will be shown in taskbar)
  if (isMinimized) return null;

  // Close on backdrop click (if enabled and not draggable)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && !draggable && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalStyle = draggable
    ? {
        position: 'fixed' as const,
        left: `${position.x}px`,
        top: `${position.y}px`,
        margin: 0,
        transform: 'none',
      }
    : {};

  const backdropStyle = draggable
    ? {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      }
    : {};

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick} style={backdropStyle}>
      <div
        ref={dragRef}
        className={`${styles.modal} ${styles[size]} ${draggable ? styles.draggable : ''} ${
          isDragging ? styles.dragging : ''
        }`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          ref={handleRef}
          className={`${styles.header} ${draggable ? styles.draggableHeader : ''}`}
        >
          {typeof title === 'string' ? (
            <h2 className={styles.title}>{title}</h2>
          ) : (
            <div className={styles.title}>{title}</div>
          )}
          
          <div className={styles.windowControls}>
            {minimizable && onMinimize && (
              <button
                className={styles.minimizeButton}
                onClick={onMinimize}
                aria-label="Minimize"
                type="button"
                title="Свернуть"
              >
                −
              </button>
            )}
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
              type="button"
              title="Закрыть"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

