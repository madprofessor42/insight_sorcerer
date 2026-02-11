/**
 * FormField - Reusable form field component with label.
 * 
 * Follows React composition pattern - extracts common form field structure.
 */

import type { ReactNode } from 'react';
import styles from './FormField.module.css';

export interface FormFieldProps {
  /** Unique ID for the input element (used for label's htmlFor) */
  id: string;
  /** Label text */
  label: string;
  /** Input element or custom content */
  children: ReactNode;
  /** Optional help text displayed below the input */
  helpText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Optional error message */
  error?: string;
}

/**
 * Reusable form field component that provides consistent styling
 * and structure for form inputs.
 * 
 * @example
 * ```tsx
 * <FormField id="email" label="Email" required>
 *   <input
 *     id="email"
 *     type="email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *   />
 * </FormField>
 * ```
 */
export function FormField({
  id,
  label,
  children,
  helpText,
  required,
  error,
}: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children}
      {helpText && <p className={styles.helpText}>{helpText}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

