/**
 * Autocomplete provider for Formula Editor
 * Provides context-aware autocomplete for functions and references
 */

import { CompletionContext } from '@codemirror/autocomplete';
import type { CompletionResult } from '@codemirror/autocomplete';
import type { AvailableReference } from '../../config';
import { FORMULA_FUNCTIONS } from '../../config/formula-functions';

export interface AutocompleteOptions {
  availableReferences: AvailableReference[];
}

// String methods
const STRING_METHODS = [
  { name: 'Parse', signature: 'Parse()', description: 'Converts string to number', example: '"123".Parse() → 123' },
  { name: 'Split', signature: 'Split(Delimiter)', description: 'Splits string by delimiter', example: '"a,b,c".Split(",") → {"a","b","c"}' },
  { name: 'Trim', signature: 'Trim()', description: 'Removes whitespace from both ends', example: '"  hello  ".Trim() → "hello"' },
  { name: 'Range', signature: 'Range(Characters)', description: 'Extracts characters by index', example: '"abcdef".Range(2:4) → "bcd"' },
  { name: 'Length', signature: 'Length()', description: 'Returns string length', example: '"Hello".Length() → 5' },
  { name: 'IndexOf', signature: 'IndexOf(Needle)', description: 'Finds index of substring', example: '"hello".IndexOf("ll") → 3' },
  { name: 'Contains', signature: 'Contains(Needle)', description: 'Checks if string contains substring', example: '"hello".Contains("ll") → true' },
  { name: 'LowerCase', signature: 'LowerCase()', description: 'Converts string to lowercase', example: '"Hello".LowerCase() → "hello"' },
  { name: 'UpperCase', signature: 'UpperCase()', description: 'Converts string to uppercase', example: '"HELLO".UpperCase() → "HELLO"' },
];

// Vector methods
const VECTOR_METHODS = [
  { name: 'Length', signature: 'Length()', description: 'Returns the number of elements', example: '{1,2,3}.Length() → 3' },
  { name: 'Sort', signature: 'Sort()', description: 'Sorts vector elements', example: '{3,1,2}.Sort() → {1,2,3}' },
  { name: 'Reverse', signature: 'Reverse()', description: 'Reverses vector order', example: '{1,2,3}.Reverse() → {3,2,1}' },
  { name: 'Unique', signature: 'Unique()', description: 'Returns unique elements', example: '{1,2,2,3}.Unique() → {1,2,3}' },
  { name: 'Join', signature: 'Join(Separator)', description: 'Joins vector elements into string', example: '{"a","b"}.Join(",") → "a,b"' },
  { name: 'IndexOf', signature: 'IndexOf(Needle)', description: 'Finds index of element', example: '{"a","b","c"}.IndexOf("b") → 2' },
  { name: 'Contains', signature: 'Contains(Needle)', description: 'Checks if vector contains element', example: '{"a","b"}.Contains("a") → true' },
  { name: 'Sample', signature: 'Sample(Sample Size, Allow Repeats=False)', description: 'Random sample from vector', example: '{1,2,3}.Sample(2)' },
  { name: 'Map', signature: 'Map(Function)', description: 'Applies function to each element', example: '{1,2,3}.Map(x^2) → {1,4,9}' },
  { name: 'Filter', signature: 'Filter(Function)', description: 'Filters vector elements', example: '{1,2,3}.Filter(x>1) → {2,3}' },
  { name: 'Flatten', signature: 'Flatten()', description: 'Flattens nested vectors', example: '{{1,2},{3,4}}.Flatten() → {1,2,3,4}' },
  { name: 'Keys', signature: 'Keys()', description: 'Returns vector keys', example: '{x:1, y:2}.Keys() → {"x","y"}' },
  { name: 'Values', signature: 'Values()', description: 'Returns vector values', example: '{x:1, y:2}.Values() → {1,2}' },
  { name: 'Union', signature: 'Union(Vector 2)', description: 'Returns union of vectors', example: '{1,2}.Union({2,3}) → {1,2,3}' },
  { name: 'Intersection', signature: 'Intersection(Second Vector)', description: 'Returns intersection of vectors', example: '{1,2}.Intersection({2,3}) → {2}' },
  { name: 'Difference', signature: 'Difference(Vector 2)', description: 'Returns difference of vectors', example: '{1,2}.Difference({2,3}) → {1}' },
];

// Agent/Population methods
const AGENT_METHODS = [
  { name: 'Add', signature: 'Add(Base Agent?)', description: 'Adds an agent to a population', example: '[Population].Add()' },
  { name: 'Remove', signature: 'Remove()', description: 'Removes an agent from a population', example: 'agent.Remove()' },
  { name: 'PopulationSize', signature: 'PopulationSize()', description: 'Returns the size of a population', example: '[Population].PopulationSize()' },
  { name: 'FindAll', signature: 'FindAll()', description: 'Finds all agents in a population', example: '[Population].FindAll()' },
  { name: 'FindIndex', signature: 'FindIndex(Index)', description: 'Finds agent by index', example: '[Population].FindIndex(1)' },
  { name: 'FindState', signature: 'FindState([State])', description: 'Finds agents in a specific state', example: '[Population].FindState([State])' },
  { name: 'FindNotState', signature: 'FindNotState([State])', description: 'Finds agents not in a specific state', example: '[Population].FindNotState([State])' },
  { name: 'FindNearest', signature: 'FindNearest(Target, Count=1)', description: 'Finds nearest agent(s)', example: '[Population].FindNearest(Target)' },
  { name: 'FindFurthest', signature: 'FindFurthest(Target, Count=1)', description: 'Finds furthest agent(s)', example: '[Population].FindFurthest(Target, 4)' },
  { name: 'FindNearby', signature: 'FindNearby(Target, Distance)', description: 'Finds agents within distance', example: '[Population].FindNearby(Target, 50)' },
  { name: 'Value', signature: 'Value([Primitive])', description: 'Gets value of a primitive in agents', example: '[Population].Value([Primitive])' },
  { name: 'SetValue', signature: 'SetValue([Primitive], Value)', description: 'Sets value of a primitive in agents', example: '[Population].SetValue([Primitive], Value)' },
  { name: 'Index', signature: 'Index()', description: 'Returns the index of an agent', example: 'Self.Index()' },
  { name: 'Location', signature: 'Location()', description: 'Returns the location of an agent', example: 'Self.Location().x' },
  { name: 'SetLocation', signature: 'SetLocation(New Location)', description: 'Sets the location of an agent', example: 'agent.SetLocation({x: 60, y: 40})' },
  { name: 'Move', signature: 'Move({x, y})', description: 'Moves an agent by a direction vector', example: 'Self.Move({x: 0, y: -5})' },
  { name: 'MoveTowards', signature: 'MoveTowards(Target, Distance)', description: 'Moves agent towards a target', example: 'Self.MoveTowards(Target, 10)' },
  { name: 'Connect', signature: 'Connect([Agent 2], Weight=1)', description: 'Creates a connection between agents', example: 'agent1.Connect(agent2, 5)' },
  { name: 'Unconnect', signature: 'Unconnect([Agent 2])', description: 'Removes a connection between agents', example: 'agent1.Unconnect(agent2)' },
  { name: 'Connected', signature: 'Connected()', description: 'Returns connected agents', example: 'Self.Connected()' },
  { name: 'ConnectionWeight', signature: 'ConnectionWeight([Agent 2])', description: 'Returns connection weight', example: 'agent1.ConnectionWeight(agent2)' },
  { name: 'SetConnectionWeight', signature: 'SetConnectionWeight([Agent 2], Weight)', description: 'Sets connection weight', example: 'agent1.SetConnectionWeight(agent2, 10)' },
];

/**
 * Detects the context before the dot to determine what methods to suggest
 */
function detectContextBeforeDot(textBefore: string): 'string' | 'vector' | 'agent' | null {
  // Match string literals: "..." or '...'
  if (/["'][^"']*$/.test(textBefore)) {
    return 'string';
  }
  
  // Match vectors: {...}
  if (/\{[^}]*\}$/.test(textBefore)) {
    return 'vector';
  }
  
  // Match references (agents/populations): [Name]
  if (/\[[^\]]+\]$/.test(textBefore)) {
    return 'agent';
  }
  
  // Match identifiers that could be variables
  if (/[\w]+$/.test(textBefore)) {
    // Could be a variable - we'll return null and let default behavior handle it
    // In future, we could track variable types
    return null;
  }
  
  return null;
}

/**
 * Creates an autocomplete source for formula editor
 */
export function createFormulaAutocomplete(options: AutocompleteOptions) {
  return function formulaAutocomplete(context: CompletionContext): CompletionResult | null {
    const word = context.matchBefore(/[\w]+/);
    const beforeWord = context.state.doc.sliceString(Math.max(0, context.pos - 100), context.pos);
    
    // Check if we're after a dot (method call)
    const afterDot = /\.(\w*)$/.exec(beforeWord);
    if (afterDot) {
      const methodPrefix = afterDot[1];
      const textBeforeDot = beforeWord.slice(0, beforeWord.lastIndexOf('.'));
      const contextType = detectContextBeforeDot(textBeforeDot);
      
      let methods: typeof STRING_METHODS = [];
      let contextName = '';
      
      if (contextType === 'string') {
        methods = STRING_METHODS;
        contextName = 'String';
      } else if (contextType === 'vector') {
        methods = VECTOR_METHODS;
        contextName = 'Vector';
      } else if (contextType === 'agent') {
        methods = AGENT_METHODS;
        contextName = 'Agent/Population';
      }
      
      if (methods.length > 0) {
        const completions = methods
          .filter(method => 
            methodPrefix === '' || 
            method.name.toLowerCase().startsWith(methodPrefix.toLowerCase())
          )
          .map(method => ({
            label: method.name,
            type: 'method',
            detail: method.signature.replace(method.name, '').trim(),
            info: () => {
              const node = document.createElement('div');
              node.style.padding = '8px';
              node.style.maxWidth = '400px';
              
              const title = document.createElement('div');
              title.style.fontWeight = 'bold';
              title.style.marginBottom = '4px';
              title.style.color = '#3db0ff';
              title.textContent = `${contextName}.${method.signature}`;
              node.appendChild(title);
              
              const desc = document.createElement('div');
              desc.style.marginBottom = '8px';
              desc.style.color = '#94a3b8';
              desc.textContent = method.description;
              node.appendChild(desc);
              
              if (method.example) {
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
                example.textContent = method.example;
                node.appendChild(example);
              }
              
              return node;
            },
            apply: method.signature,
          }));
        
        return {
          from: context.pos - methodPrefix.length,
          options: completions,
          validFor: /^[\w]*$/,
        };
      }
    }

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
    const beforeText = context.state.doc.sliceString(Math.max(0, context.pos - 100), context.pos);
    
    // Check if we're after [Reference].
    const afterRefDot = /\[[\w\s]+\]\.(\w*)$/.exec(beforeText);
    if (afterRefDot) {
      const methodPrefix = afterRefDot[1];
      
      // Show agent methods for references
      const completions = AGENT_METHODS
        .filter(method => 
          methodPrefix === '' || 
          method.name.toLowerCase().startsWith(methodPrefix.toLowerCase())
        )
        .map(method => ({
          label: method.name,
          type: 'method',
          detail: method.signature.replace(method.name, '').trim(),
          info: () => {
            const node = document.createElement('div');
            node.style.padding = '8px';
            node.style.maxWidth = '400px';
            
            const title = document.createElement('div');
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '4px';
            title.style.color = '#3db0ff';
            title.textContent = `[Reference].${method.signature}`;
            node.appendChild(title);
            
            const desc = document.createElement('div');
            desc.style.marginBottom = '8px';
            desc.style.color = '#94a3b8';
            desc.textContent = method.description;
            node.appendChild(desc);
            
            if (method.example) {
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
              example.textContent = method.example;
              node.appendChild(example);
            }
            
            return node;
          },
          apply: method.signature,
        }));
      
      return {
        from: context.pos - methodPrefix.length,
        options: completions,
        validFor: /^[\w]*$/,
      };
    }
    
    // Check if we're inside a reference bracket [
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

