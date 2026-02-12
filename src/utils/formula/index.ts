/**
 * Formula Editor Utilities
 * Central export point for all formula-related functionality
 */

// Language and syntax highlighting
export { formulaLanguage, formulaHighlightStyle } from './language';

// Autocomplete providers
export { createFormulaAutocomplete, referenceCompletionSource } from './autocomplete';
export type { AutocompleteOptions } from './autocomplete';

