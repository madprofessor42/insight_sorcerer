/**
 * FormulaInput - Input field with autocomplete for formula references.
 * 
 * Shows available elements that can be referenced with [Name] syntax.
 * Displays "bubbles" (dropdown suggestions) when focused.
 */

import { useState, useCallback, useRef } from 'react';
import { useClickOutside } from '../../../hooks/useClickOutside';
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close suggestions
  useClickOutside(
    [inputRef, suggestionsRef],
    () => setShowSuggestions(false),
    showSuggestions
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue === '' ? undefined : newValue);
    },
    [onChange]
  );

  const handleFocus = useCallback(() => {
    if (availableReferences.length > 0) {
      setShowSuggestions(true);
    }
  }, [availableReferences.length]);

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
        
        // Set cursor position after inserted reference and keep suggestions open
        const newCursorPos = start + refName.length + 2; // +2 for brackets
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
      
      // Keep suggestions open after insertion
      // User can continue adding more references
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
          onFocus={handleFocus}
          className={styles.input}
          placeholder={placeholder}
        />
        {showSuggestions && availableReferences.length > 0 && (
          <div ref={suggestionsRef} className={styles.suggestions}>
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

