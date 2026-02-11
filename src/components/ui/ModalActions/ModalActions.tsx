/**
 * ModalActions - Reusable modal action buttons component.
 * 
 * Follows React composition pattern - provides consistent modal footer.
 */

import type { ReactNode } from 'react';
import styles from './ModalActions.module.css';

export interface ModalActionsProps {
  /** Custom action buttons (if provided, other props are ignored) */
  children?: ReactNode;
  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string;
  /** Confirm button label (default: "OK") */
  confirmLabel?: string;
  /** Cancel button click handler */
  onCancel?: () => void;
  /** Confirm button click handler */
  onConfirm?: () => void;
  /** Whether confirm button is disabled */
  confirmDisabled?: boolean;
  /** Confirm button variant */
  confirmVariant?: 'primary' | 'danger' | 'success';
}

/**
 * Reusable modal actions component that provides consistent styling
 * for modal footer buttons.
 * 
 * @example
 * ```tsx
 * // Simple usage with default buttons
 * <ModalActions
 *   onCancel={handleCancel}
 *   onConfirm={handleConfirm}
 *   confirmLabel="Save"
 *   confirmDisabled={!isValid}
 * />
 * 
 * // Custom buttons
 * <ModalActions>
 *   <button onClick={handleDelete}>Delete</button>
 *   <button onClick={handleSave}>Save</button>
 * </ModalActions>
 * ```
 */
export function ModalActions({
  children,
  cancelLabel = 'Cancel',
  confirmLabel = 'OK',
  onCancel,
  onConfirm,
  confirmDisabled,
  confirmVariant = 'primary',
}: ModalActionsProps) {
  if (children) {
    return <div className={styles.actions}>{children}</div>;
  }

  return (
    <div className={styles.actions}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
        >
          {cancelLabel}
        </button>
      )}
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={`${styles.confirmButton} ${styles[confirmVariant]}`}
        >
          {confirmLabel}
        </button>
      )}
    </div>
  );
}

