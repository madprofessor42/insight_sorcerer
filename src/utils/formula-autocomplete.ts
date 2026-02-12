/**
 * Autocomplete provider for Formula Editor
 * Provides context-aware autocomplete for functions and references
 */

import { CompletionContext } from '@codemirror/autocomplete';
import type { CompletionResult } from '@codemirror/autocomplete';
import type { AvailableReference } from '../config';
import { FORMULA_FUNCTIONS } from '../config/formula-functions';

export interface AutocompleteOptions {
  availableReferences: AvailableReference[];
}

/**
 * Creates an autocomplete source for formula editor
 */
export function createFormulaAutocomplete(options: AutocompleteOptions) {
  return function formulaAutocomplete(context: CompletionContext): CompletionResult | null {
    const word = context.matchBefore(/[\w]+/);
    const beforeWord = context.state.doc.sliceString(Math.max(0, context.pos - 20), context.pos);

    // Check if we're inside a reference bracket [
    const inReference = beforeWord.lastIndexOf('[') > beforeWord.lastIndexOf(']');

    if (inReference) {
      // Autocomplete references
      const refWord = beforeWord.slice(beforeWord.lastIndexOf('[') + 1);
      
      const completions = options.availableReferences
        .filter(ref => 
          refWord === '' || 
          ref.name.toLowerCase().includes(refWord.toLowerCase())
        )
        .map(ref => ({
          label: ref.name,
          type: 'variable',
          detail: ref.type,
          info: `${ref.type}: ${ref.name}`,
          apply: ref.name,
        }));

      return {
        from: context.pos - refWord.length,
        options: completions,
        validFor: /^[\w\s]*$/,
      };
    }

    // Autocomplete functions and keywords
    if (word) {
      const completions: any[] = [];

      // Add all functions from FORMULA_FUNCTIONS
      FORMULA_FUNCTIONS.forEach(category => {
        category.functions.forEach(fn => {
          if (fn.name.toLowerCase().startsWith(word.text.toLowerCase())) {
            completions.push({
              label: fn.name,
              type: 'function',
              detail: fn.displaySignature || fn.signature.replace(fn.name, '').trim(),
              info: () => {
                const node = document.createElement('div');
                node.style.padding = '8px';
                node.style.maxWidth = '400px';
                
                const title = document.createElement('div');
                title.style.fontWeight = 'bold';
                title.style.marginBottom = '4px';
                title.textContent = fn.signature;
                node.appendChild(title);
                
                const desc = document.createElement('div');
                desc.style.marginBottom = '8px';
                desc.style.color = '#94a3b8';
                desc.textContent = fn.description;
                node.appendChild(desc);
                
                if (fn.example) {
                  const exampleLabel = document.createElement('div');
                  exampleLabel.style.fontWeight = '600';
                  exampleLabel.style.marginTop = '8px';
                  exampleLabel.style.marginBottom = '4px';
                  exampleLabel.textContent = 'Example:';
                  node.appendChild(exampleLabel);
                  
                  const example = document.createElement('code');
                  example.style.display = 'block';
                  example.style.padding = '4px 8px';
                  example.style.backgroundColor = '#0f172a';
                  example.style.borderRadius = '4px';
                  example.style.fontFamily = 'monospace';
                  example.style.fontSize = '12px';
                  example.textContent = fn.example;
                  node.appendChild(example);
                }
                
                return node;
              },
              apply: fn.signature,
            });
          }
        });
      });

      // Add keywords
      const keywords = [
        'if', 'then', 'else', 'end if',
        'while', 'end loop',
        'for', 'from', 'to', 'by', 'in',
        'Function', 'End Function',
        'Try', 'Catch', 'End Try',
        'and', 'or', 'not', 'mod',
        'true', 'false',
      ];

      keywords.forEach(kw => {
        if (kw.toLowerCase().startsWith(word.text.toLowerCase())) {
          completions.push({
            label: kw,
            type: 'keyword',
            apply: kw,
          });
        }
      });

      // Add constants
      const constants = [
        { label: 'pi', detail: '3.14159265', info: 'The constant π (pi)' },
        { label: 'e', detail: '2.71828183', info: 'The constant e (Euler\'s number)' },
      ];

      constants.forEach(constant => {
        if (constant.label.toLowerCase().startsWith(word.text.toLowerCase())) {
          completions.push({
            ...constant,
            type: 'constant',
            apply: constant.label,
          });
        }
      });

      if (completions.length === 0) {
        return null;
      }

      return {
        from: word.from,
        options: completions,
        validFor: /^[\w]*$/,
      };
    }

    return null;
  };
}

/**
 * Creates a completion source that triggers on '[' for references
 */
export function referenceCompletionSource(options: AutocompleteOptions) {
  return function(context: CompletionContext): CompletionResult | null {
    const before = context.matchBefore(/\[[\w\s]*$/);
    
    if (!before) {
      return null;
    }

    const searchText = before.text.slice(1); // Remove the '['

    const completions = options.availableReferences
      .filter(ref => 
        searchText === '' || 
        ref.name.toLowerCase().includes(searchText.toLowerCase())
      )
      .map(ref => ({
        label: `[${ref.name}]`,
        type: 'variable',
        detail: ref.type,
        info: `${ref.type}: ${ref.name}`,
        apply: `[${ref.name}]`,
      }));

    return {
      from: before.from,
      options: completions,
      validFor: /^\[[\w\s]*$/,
    };
  };
}

