/**
 * Formula Language Mode for CodeMirror 6
 * Provides syntax highlighting for formula expressions
 */

import { StreamLanguage, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

interface FormulaState {
  inComment: boolean;
}

// Keywords in the formula language
const keywords = new Set([
  'if', 'then', 'else', 'end',
  'while', 'for', 'from', 'to', 'by', 'in', 'loop',
  'Function', 'End',
  'Try', 'Catch',
  'throw',
  'and', 'or', 'not',
  'mod',
  'true', 'false',
]);

// Built-in constants
const constants = new Set(['pi', 'e']);

// Built-in functions from FORMULA_FUNCTIONS
const builtinFunctions = new Set([
  // Mathematical
  'Round', 'Ceiling', 'Floor', 'Abs', 'Sqrt', 'Exp', 'Ln', 'Log',
  'Sin', 'Cos', 'Tan', 'ArcSin', 'ArcCos', 'ArcTan',
  'Sign', 'Logit', 'Expit',
  // Time
  'Time', 'TimeStep', 'TimeStart', 'TimeEnd', 'TimeLength',
  'Seconds', 'Minutes', 'Hours', 'Days', 'Weeks', 'Months', 'Years',
  'Pulse', 'Step', 'Ramp', 'Seasonal',
  // Historical
  'Delay', 'Smooth', 'Delay1', 'Delay3', 'DelayN', 'SmoothN',
  'PastValues', 'PastMean', 'PastMedian', 'PastStdDev', 'PastMax', 'PastMin',
  'PastCorrelation', 'Fix',
  // Random
  'Rand', 'RandNormal', 'RandExp', 'RandLognormal', 'RandBinomial',
  'RandNegativeBinomial', 'RandPoisson', 'RandGamma', 'RandTriangular',
  'RandBeta', 'RandBoolean', 'RandDist', 'SetRandSeed',
  // Vector
  'Range', 'Sum', 'Mean', 'Median', 'StdDev', 'Min', 'Max', 'Product',
  'Join', 'Lookup', 'Repeat',
  // String
  'Parse', 'Split', 'Trim', 'Length', 'IndexOf', 'Contains',
  'LowerCase', 'UpperCase',
  // General
  'Stop', 'Pause', 'ConverterTable',
  'Alert', 'Prompt', 'Confirm',
  'IfThenElse',
  // Statistical
  'CDFNormal', 'PDFNormal', 'InvNormal',
  'CDFLognormal', 'PDFLognormal', 'InvLognormal',
  'CDFt', 'PDFt', 'Invt',
  'CDFF', 'PDFF', 'InvF',
  'CDFChiSquared', 'PDFChiSquared', 'InvChiSquared',
  'CDFExponential', 'PDFExponential', 'InvExponential',
  'CDFPoisson', 'PMFPoisson',
  // Agent Functions (common methods)
  'Add', 'Remove', 'PopulationSize', 'FindAll', 'FindIndex', 'FindState',
  'FindNotState', 'FindNearest', 'FindFurthest', 'FindNearby',
  'Value', 'SetValue', 'Index', 'Location', 'SetLocation',
  'Move', 'MoveTowards', 'Distance', 'Width', 'Height',
  'Connect', 'Unconnect', 'Connected', 'ConnectionWeight', 'SetConnectionWeight',
  'Transition', 'ResetTimer',
  'Sort', 'Reverse', 'Unique', 'Map', 'Filter', 'Flatten',
  'Keys', 'Values', 'Union', 'Intersection', 'Difference', 'Sample',
]);

const formulaLanguage = StreamLanguage.define<FormulaState>({
  startState: () => ({ inComment: false }),

  token(stream, state) {
    // Handle multi-line comments
    if (state.inComment) {
      if (stream.match('*/')) {
        state.inComment = false;
        return 'comment';
      }
      stream.next();
      return 'comment';
    }

    if (stream.match('/*')) {
      state.inComment = true;
      return 'comment';
    }

    // Single-line comments
    if (stream.match('#')) {
      stream.skipToEnd();
      return 'lineComment';
    }

    // Whitespace
    if (stream.eatSpace()) {
      return null;
    }

    // References [Name]
    if (stream.match(/^\[[\w\s]+\]/)) {
      return 'variableName';
    }

    // Time units {5 Years}
    if (stream.match(/^\{[^}]+\}/)) {
      return 'literal';
    }

    // Strings
    if (stream.match(/^"([^"\\]|\\.)*"/)) {
      return 'string';
    }
    if (stream.match(/^'([^'\\]|\\.)*'/)) {
      return 'string';
    }

    // Numbers (including decimals)
    if (stream.match(/^-?\d+\.?\d*/)) {
      return 'number';
    }

    // Operators
    if (stream.match(/^(<-|<=|>=|==|!=|->)/)) {
      return 'operator';
    }
    if (stream.match(/^[+\-*\/^<>=(){}[\],:;.]/)) {
      return 'operator';
    }

    // Word tokens (keywords, functions, identifiers)
    const wordMatch = stream.match(/^[\w]+/);
    if (wordMatch && typeof wordMatch !== 'boolean') {
      const w = wordMatch[0];
      
      if (keywords.has(w)) {
        return 'keyword';
      }
      if (constants.has(w)) {
        return 'atom';
      }
      if (builtinFunctions.has(w)) {
        return 'name.standard';
      }
      
      // Check if next non-whitespace character is '(' - likely a function
      const pos = stream.pos;
      stream.eatSpace();
      if (stream.peek() === '(') {
        stream.pos = pos;
        return 'name.standard';
      }
      stream.pos = pos;
      
      return 'name';
    }

    stream.next();
    return null;
  },

  languageData: {
    commentTokens: { line: '#', block: { open: '/*', close: '*/' } },
  },
});

// Create bright highlight style for formula syntax
const formulaHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#e88dff', fontWeight: '900', textShadow: '0 0 12px rgba(232, 141, 255, 0.7)' },
  { tag: t.standard(t.name), color: '#3db0ff', fontWeight: '900', textShadow: '0 0 10px rgba(61, 176, 255, 0.6)' },
  { tag: t.variableName, color: '#ffdd00', fontWeight: '900', textShadow: '0 0 12px rgba(255, 221, 0, 0.7)' },
  { tag: t.operator, color: '#00ffff', fontWeight: '900', textShadow: '0 0 10px rgba(0, 255, 255, 0.6)' },
  { tag: t.number, color: '#ffbb33', fontWeight: '900', textShadow: '0 0 10px rgba(255, 187, 51, 0.6)' },
  { tag: t.string, color: '#aaff55', fontWeight: '800', textShadow: '0 0 12px rgba(170, 255, 85, 0.6)' },
  { tag: [t.comment, t.lineComment], color: '#b4c0e0', fontStyle: 'italic', fontWeight: '600' },
  { tag: t.atom, color: '#ff4444', fontWeight: '900', textShadow: '0 0 10px rgba(255, 68, 68, 0.6)' },
  { tag: t.literal, color: '#aaff55', fontWeight: '800', textShadow: '0 0 12px rgba(170, 255, 85, 0.6)' },
  { tag: t.name, color: '#e0e0e0', fontWeight: '600' },
]);

export { formulaLanguage, formulaHighlightStyle };

