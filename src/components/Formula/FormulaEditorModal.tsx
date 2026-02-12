/**
 * FormulaEditorModal - Expanded modal for editing complex formulas.
 * 
 * Provides a larger editing area with the same functionality as FormulaInput.
 * Designed to be extensible for future features.
 */

import { useCallback, useEffect, useState } from 'react';
import type { AvailableReference } from '../../config';
import { FORMULA_FUNCTIONS, getTypeColor } from '../../config';
import { FormulaEditor, useFormulaEditorRef } from './FormulaEditor';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['References']));
  const { editorViewRef, insertText, focus } = useFormulaEditorRef();

  // Update local state when modal opens with new value
  useEffect(() => {
    if (isOpen) {
      setEditedValue(value);
      // Focus editor when modal opens
      setTimeout(() => {
        focus();
      }, 100);
    }
  }, [isOpen, value, focus]);

  const handleInputChange = useCallback(
    (newValue: string | number | undefined) => {
      setEditedValue(newValue);
    },
    []
  );

  const insertReference = useCallback(
    (refName: string) => {
      insertText(`[${refName}]`);
    },
    [insertText]
  );

  const insertFunction = useCallback(
    (signature: string) => {
      insertText(signature);
    },
    [insertText]
  );

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handleApply = useCallback(() => {
    onApply(editedValue);
  }, [editedValue, onApply]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
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
            <FormulaEditor
              value={editedValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              availableReferences={availableReferences}
              onApply={handleApply}
              onCancel={onCancel}
              editorViewRef={editorViewRef}
            />
          </div>

          <div className={styles.sidebar}>
            <div className={styles.searchSection}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Filter functions and references..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.categoriesSection}>
              {/* References Category */}
              {availableReferences.length > 0 && (
                <div className={styles.category}>
                  <button
                    type="button"
                    className={styles.categoryHeader}
                    onClick={() => toggleCategory('References')}
                  >
                    <span className={styles.categoryIcon}>
                      {expandedCategories.has('References') ? '▼' : '▶'}
                    </span>
                    <span className={styles.categoryName}>References</span>
                  </button>
                  {expandedCategories.has('References') && (
                    <div className={styles.categoryContent}>
                      {availableReferences
                        .filter((ref) =>
                          searchQuery === '' ||
                          ref.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((ref) => (
                          <button
                            key={ref.id}
                            type="button"
                            className={styles.item}
                            onClick={() => insertReference(ref.name)}
                            title={`${ref.type}: ${ref.name}`}
                          >
                            <span
                              className={styles.itemBadge}
                              style={{ backgroundColor: getTypeColor(ref.type) }}
                            >
                              {ref.type}
                            </span>
                            <span className={styles.itemName}>[{ref.name}]</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Function Categories */}
              {FORMULA_FUNCTIONS.map((category) => {
                const filteredFunctions = category.functions.filter(
                  (fn) =>
                    searchQuery === '' ||
                    fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    fn.description.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredFunctions.length === 0) return null;

                return (
                  <div key={category.name} className={styles.category}>
                    <button
                      type="button"
                      className={styles.categoryHeader}
                      onClick={() => toggleCategory(category.name)}
                    >
                      <span className={styles.categoryIcon}>
                        {expandedCategories.has(category.name) ? '▼' : '▶'}
                      </span>
                      <span className={styles.categoryName}>{category.name}</span>
                    </button>
                    {expandedCategories.has(category.name) && (
                      <div className={styles.categoryContent}>
                        {filteredFunctions.map((fn) => (
                          <button
                            key={fn.name}
                            type="button"
                            className={styles.item}
                            onClick={() => insertFunction(fn.signature)}
                            title={`${fn.description}${fn.example ? '\nExample: ' + fn.example : ''}`}
                          >
                            <span className={styles.itemName}>{fn.name}</span>
                            <span className={styles.itemSignature}>
                              {fn.displaySignature || fn.signature.replace(fn.name, '')}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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

