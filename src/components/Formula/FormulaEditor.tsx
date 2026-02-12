/**
 * FormulaEditor - CodeMirror-based editor for formula expressions
 * Provides syntax highlighting and autocomplete
 */

import { useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting } from '@codemirror/language';
import type { AvailableReference } from '../../config';
import {
  formulaLanguage,
  formulaHighlightStyle,
  createFormulaAutocomplete,
  referenceCompletionSource,
} from '../../utils/formula';
import styles from './FormulaEditor.module.css';

export interface FormulaEditorProps {
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
  placeholder?: string;
  availableReferences: AvailableReference[];
  onApply?: () => void;
  onCancel?: () => void;
  editorViewRef?: React.MutableRefObject<EditorView | null>;
}

export interface FormulaEditorHandle {
  insertText: (text: string) => void;
  focus: () => void;
}

/**
 * Formula editor with syntax highlighting and autocomplete
 */
export function FormulaEditor({
  value,
  onChange,
  placeholder,
  availableReferences,
  onApply,
  onCancel,
  editorViewRef,
}: FormulaEditorProps) {
  const localEditorRef = useRef<any>(null);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val === '' ? undefined : val);
    },
    [onChange]
  );

  // Expose EditorView to parent through ref
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localEditorRef.current && editorViewRef) {
        const editor = localEditorRef.current;
        if (editor.view) {
          editorViewRef.current = editor.view;
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [editorViewRef, value]);

  // Create extensions for CodeMirror
  const extensions = [
    formulaLanguage,
    history(),
    syntaxHighlighting(formulaHighlightStyle),
    autocompletion({
      override: [
        createFormulaAutocomplete({ availableReferences }),
        referenceCompletionSource({ availableReferences }),
      ],
      activateOnTyping: true,
      maxRenderedOptions: 20,
      defaultKeymap: true,
    }),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          if (onApply) {
            onApply();
            return true;
          }
          return false;
        },
      },
      {
        key: 'Escape',
        run: () => {
          if (onCancel) {
            onCancel();
            return true;
          }
          return false;
        },
      },
    ]),
    EditorView.lineWrapping,
    EditorView.theme({
      '&': {
        fontSize: '15px',
        fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
        backgroundColor: '#1e2433',
        color: '#ffffff',
        fontWeight: '600',
      },
      '.cm-content': {
        minHeight: '500px',
        padding: '12px',
        caretColor: '#ffffff',
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
      '.cm-line': {
        color: '#ffffff',
      },
      '.cm-cursor': {
        borderLeftColor: '#ffffff',
        borderLeftWidth: '2px',
      },
      '.cm-gutters': {
        backgroundColor: '#181d2a',
        borderRight: '1px solid #374151',
        color: '#9ca3af',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
      },
      '.cm-selectionBackground': {
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
      },
    }, { dark: true }),
  ];

  return (
    <div className={styles.editorWrapper}>
      <CodeMirror
        ref={localEditorRef}
        value={String(value ?? '')}
        height="500px"
        extensions={extensions}
        onChange={handleChange}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: false,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: false,
          completionKeymap: true,
          lintKeymap: false,
        }}
      />
    </div>
  );
}

/**
 * Hook to create a ref for FormulaEditor with insertText functionality
 */
export function useFormulaEditorRef() {
  const editorViewRef = useRef<EditorView | null>(null);

  const insertText = useCallback((text: string) => {
    if (editorViewRef.current) {
      const view = editorViewRef.current;
      const { from, to } = view.state.selection.main;
      
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
      });
      
      view.focus();
    }
  }, []);

  const focus = useCallback(() => {
    if (editorViewRef.current) {
      editorViewRef.current.focus();
    }
  }, []);

  return {
    editorViewRef,
    insertText,
    focus,
  };
}

