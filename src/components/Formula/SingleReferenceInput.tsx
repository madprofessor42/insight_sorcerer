/**
 * SingleReferenceInput - Input field for selecting a single reference from bubbles.
 * 
 * Similar to FormulaInput but allows selecting only one reference instead of building a formula.
 * Used for Converter Input Source selection.
 */

import { useCallback } from 'react';
import type { AvailableReference } from '../../config';
import { getTypeColor } from '../../config';
import styles from './SingleReferenceInput.module.css';

export interface SingleReferenceInputProps {
  id: string;
  label: string;
  value: string | undefined;
  placeholder?: string;
  onChange: (value: string | undefined) => void;
  availableReferences: AvailableReference[];
  defaultOptions?: Array<{ value: string; label: string }>;
}

/**
 * Input field for selecting a single reference from available bubbles.
 * Displays current selection and allows clicking bubbles to select a new one.
 */
export function SingleReferenceInput({
  id,
  label,
  value,
  placeholder = 'Select a reference...',
  onChange,
  availableReferences,
  defaultOptions = [],
}: SingleReferenceInputProps) {
  const handleSelect = useCallback(
    (refId: string) => {
      onChange(refId);
    },
    [onChange]
  );

  // Find current selection
  const currentSelection = availableReferences.find(ref => String(ref.id) === value);
  const currentDefaultOption = defaultOptions.find(opt => opt.value === value);

  return (
    <div className={styles.container}>
      <label htmlFor={id} className={styles.label}>
        {label}:
      </label>
      
      {/* Current Selection Display */}
      <div className={styles.currentSelection}>
        {currentSelection ? (
          <div className={styles.selectedBadge}>
            <span
              className={styles.selectedType}
              style={{ backgroundColor: getTypeColor(currentSelection.type) }}
            >
              {currentSelection.type}
            </span>
            <span className={styles.selectedName}>{currentSelection.name}</span>
          </div>
        ) : currentDefaultOption ? (
          <div className={styles.selectedBadge}>
            <span className={styles.selectedName}>{currentDefaultOption.label}</span>
          </div>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
      </div>

      {/* Available References (Bubbles) */}
      <div className={styles.suggestions}>
        {/* Default Options */}
        {defaultOptions.length > 0 && (
          <>
            <div className={styles.suggestionsHeader}>Default Options:</div>
            {defaultOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.suggestion} ${value === option.value ? styles.suggestionActive : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                <span className={styles.suggestionName}>{option.label}</span>
              </button>
            ))}
          </>
        )}

        {/* Available References */}
        {availableReferences.length > 0 && (
          <>
            <div className={styles.suggestionsHeader}>
              {defaultOptions.length > 0 ? 'Connected Elements:' : 'Available References:'}
            </div>
            {availableReferences.map((ref) => (
              <button
                key={ref.id}
                type="button"
                className={`${styles.suggestion} ${String(ref.id) === value ? styles.suggestionActive : ''}`}
                onClick={() => handleSelect(String(ref.id))}
              >
                <span
                  className={styles.suggestionType}
                  style={{ backgroundColor: getTypeColor(ref.type) }}
                >
                  {ref.type}
                </span>
                <span className={styles.suggestionName}>{ref.name}</span>
              </button>
            ))}
          </>
        )}
        
        {availableReferences.length === 0 && defaultOptions.length === 0 && (
          <div className={styles.noSuggestions}>
            No references available. Connect elements to this node.
          </div>
        )}
      </div>
    </div>
  );
}

