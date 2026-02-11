/**
 * FormulaEditorModal - Expanded modal for editing complex formulas.
 * 
 * Provides a larger editing area with the same functionality as FormulaInput.
 * Designed to be extensible for future features.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import type { AvailableReference } from '../../config';
import styles from './FormulaEditorModal.module.css';

export interface FormulaEditorModalProps {
  isOpen: boolean;
  label: string;
  value: string | number | undefined;
  placeholder?: string;
  availableReferences: AvailableReference[];
  onApply: (value: string | number | undefined) => void;
  onCancel: () => void;
}

/**
 * Expanded modal for editing formulas with more space and future extensibility.
 */
export function FormulaEditorModal({
  isOpen,
  label,
  value,
  placeholder,
  availableReferences,
  onApply,
  onCancel,
}: FormulaEditorModalProps) {
  const [editedValue, setEditedValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local state when modal opens with new value
  useEffect(() => {
    if (isOpen) {
      setEditedValue(value);
      // Focus textarea when modal opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setEditedValue(newValue === '' ? undefined : newValue);
    },
    []
  );

  const insertReference = useCallback(
    (refName: string) => {
      const currentValue = String(editedValue || '');
      const textarea = textareaRef.current;
      
      if (textarea) {
        const start = textarea.selectionStart || currentValue.length;
        const end = textarea.selectionEnd || currentValue.length;
        
        // Insert [RefName] at cursor position
        const newValue =
          currentValue.substring(0, start) +
          `[${refName}]` +
          currentValue.substring(end);
        
        setEditedValue(newValue);
        
        // Set cursor position after inserted reference
        const newCursorPos = start + refName.length + 2; // +2 for brackets
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    },
    [editedValue]
  );

  const handleApply = useCallback(() => {
    onApply(editedValue);
  }, [editedValue, onApply]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl/Cmd + Enter to apply
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [handleApply, onCancel]
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Stock':
        return '#4A90E2';
      case 'Variable':
        return '#50C878';
      case 'Cloud':
        return '#87CEEB';
      case 'flow':
        return '#4A90E2';
      case 'link':
        return '#666';
      default:
        return '#666';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{label}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.editorSection}>
            <textarea
              ref={textareaRef}
              value={editedValue ?? ''}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={styles.textarea}
              placeholder={placeholder}
            />
          </div>

          {availableReferences.length > 0 && (
            <div className={styles.referencesSection}>
              <div className={styles.referencesHeader}>
                Доступные ссылки:
              </div>
              <div className={styles.references}>
                {availableReferences.map((ref) => (
                  <button
                    key={ref.id}
                    type="button"
                    className={styles.reference}
                    onClick={() => insertReference(ref.name)}
                  >
                    <span
                      className={styles.referenceType}
                      style={{ backgroundColor: getTypeColor(ref.type) }}
                    >
                      {ref.type}
                    </span>
                    <span className={styles.referenceName}>[{ref.name}]</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.applyButton}
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

