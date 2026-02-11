/**
 * FormulaInput - Input field with autocomplete for formula references.
 * 
 * Shows available elements that can be referenced with [Name] syntax.
 * Displays "bubbles" (available references) always below the input.
 */

import { useCallback, useRef } from 'react';
import styles from './FormulaInput.module.css';

export interface AvailableReference {
  id: string | number;
  name: string;
  type: 'Stock' | 'Variable' | 'Cloud' | 'link' | 'flow' | string;
}

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue === '' ? undefined : newValue);
    },
    [onChange]
  );

  const insertReference = useCallback(
    (refName: string) => {
      const currentValue = String(value || '');
      const input = inputRef.current;
      
      if (input) {
        const start = input.selectionStart || currentValue.length;
        const end = input.selectionEnd || currentValue.length;
        
        // Insert [RefName] at cursor position
        const newValue =
          currentValue.substring(0, start) +
          `[${refName}]` +
          currentValue.substring(end);
        
        onChange(newValue);
        
        // Set cursor position after inserted reference
        const newCursorPos = start + refName.length + 2; // +2 for brackets
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    },
    [value, onChange]
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

  return (
    <div className={styles.container}>
      <label htmlFor={id} className={styles.label}>
        {label}:
      </label>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value ?? ''}
          onChange={handleInputChange}
          className={styles.input}
          placeholder={placeholder}
        />
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
    </div>
  );
}

