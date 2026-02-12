/**
 * Type definitions for formula functions
 */

/**
 * Single formula function definition
 */
export interface FormulaFunction {
  name: string;
  signature: string;
  displaySignature?: string;
  description: string;
  example?: string;
}

/**
 * Category of formula functions
 */
export interface FunctionCategory {
  name: string;
  functions: FormulaFunction[];
}

