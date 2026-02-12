/**
 * FormulaInput - Input field with autocomplete for formula references.
 * 
 * Shows available elements that can be referenced with [Name] syntax.
 * Displays "bubbles" (available references) always below the input.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import type { AvailableReference } from '../../config';
import { getTypeColor } from '../../config';
import styles from './FormulaInput.module.css';
import { FormulaEditorModal } from './FormulaEditorModal';

export interface FormulaInputProps {
  id: string;
  label: string;
  value: string | number | undefined;
  placeholder?: string;
  onChange: (value: string | number | undefined) => void;
  availableReferences: AvailableReference[];
}

/**
 * Input field with autocomplete for formula references.
 * Shows available elements that can be referenced with [Name] syntax.
 */
export function FormulaInput({
  id,
  label,
  value,
  placeholder,
  onChange,
  availableReferences,
}: FormulaInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-resize textarea based on content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set new height based on scrollHeight
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue === '' ? undefined : newValue);
      // Adjust height immediately on input
      adjustHeight();
    },
    [onChange, adjustHeight]
  );

  const insertReference = useCallback(
    (refName: string) => {
      const currentValue = String(value || '');
      const textarea = textareaRef.current;
      
      if (textarea) {
        const start = textarea.selectionStart || currentValue.length;
        const end = textarea.selectionEnd || currentValue.length;
        
        // Insert [RefName] at cursor position
        const newValue =
          currentValue.substring(0, start) +
          `[${refName}]` +
          currentValue.substring(end);
        
        onChange(newValue);
        
        // Set cursor position after inserted reference
        const newCursorPos = start + refName.length + 2; // +2 for brackets
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          adjustHeight();
        }, 0);
      }
    },
    [value, onChange, adjustHeight]
  );

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleApplyModal = useCallback(
    (newValue: string | number | undefined) => {
      onChange(newValue);
      setIsModalOpen(false);
    },
    [onChange]
  );

  return (
    <div className={styles.container}>
      <label htmlFor={id} className={styles.label}>
        {label}:
      </label>
      <div className={styles.inputWrapper}>
        <div className={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            id={id}
            value={value ?? ''}
            onChange={handleInputChange}
            className={styles.input}
            placeholder={placeholder}
            rows={1}
          />
          <button
            type="button"
            className={styles.expandButton}
            onClick={handleOpenModal}
            title="Expand editor"
            aria-label="Expand editor"
          >
            ⤢
          </button>
        </div>
        {availableReferences.length > 0 && (
          <div className={styles.suggestions}>
            <div className={styles.suggestionsHeader}>
              Доступные ссылки:
            </div>
            {availableReferences.map((ref) => (
              <button
                key={ref.id}
                type="button"
                className={styles.suggestion}
                onClick={() => insertReference(ref.name)}
              >
                <span
                  className={styles.suggestionType}
                  style={{ backgroundColor: getTypeColor(ref.type) }}
                >
                  {ref.type}
                </span>
                <span className={styles.suggestionName}>[{ref.name}]</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <FormulaEditorModal
        isOpen={isModalOpen}
        label={label}
        value={value}
        placeholder={placeholder}
        availableReferences={availableReferences}
        onApply={handleApplyModal}
        onCancel={handleCloseModal}
      />
    </div>
  );
}

