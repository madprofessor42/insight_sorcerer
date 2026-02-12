/**
 * Node configurations and utilities
 */

import type { NodeConfiguration, NodeType, ManuallyCreatableNodeType } from './diagram-types';

/**
 * ALL NODE CONFIGURATIONS
 * Single source of truth for everything about node types
 * To add a new node type, just add a new entry here!
 */
export const NODE_CONFIGURATIONS: NodeConfiguration[] = [
  {
    id: 'Stock',
    label: 'Stock',
    description: 'Stock node - represents an accumulation or reservoir',
    
    style: {
      shape: 'Rectangle',
      fill: '#4A90E2',
      stroke: '#2E5C8A',
      strokeWidth: 2,
      width: 120,
      height: 60,
      textColor: 'white',
      font: 'bold 14px sans-serif',
      textEditable: true,
      defaultText: 'Stock'
    },
    
    port: {
      showCenterPort: true,
      centerPortFill: '#2E5C8A',
      centerPortStroke: '#1E3C5A',
      centerPortSize: 20,
      fromLinkable: true,
      toLinkable: true
    },
    
    displayProperties: [
      {
        dataKey: 'name',
        label: 'Name',
        editable: true,
        defaultValue: 'Stock',
        showAsMainLabel: true, // Show as main text on node
        editorType: 'text'
      },
      {
        dataKey: 'initialValue',
        label: 'Initial Value',
        editable: true,
        defaultValue: '',
        showAsTooltip: true,
        editorType: 'formula'
      },
      {
        dataKey: 'note',
        label: 'Note',
        editable: true,
        defaultValue: '',
        showAsTooltip: true,
        editorType: 'text'
      }
    ],
    
    manuallyCreatable: true
  },
  {
    id: 'Variable',
    label: 'Variable',
    description: 'Variable node - represents a calculated value or parameter',
    
    style: {
      shape: 'Ellipse',
      fill: '#50C878',
      stroke: '#2E7D4E',
      strokeWidth: 2,
      width: 100,
      height: 100,
      textColor: 'white',
      font: 'bold 14px sans-serif',
      textEditable: true,
      defaultText: 'Variable'
    },
    
    port: {
      showCenterPort: true,
      centerPortFill: '#2E7D4E',
      centerPortStroke: '#1E5D3E',
      centerPortSize: 20,
      fromLinkable: true,
      toLinkable: true
    },
    
    displayProperties: [
      {
        dataKey: 'name',
        label: 'Name',
        editable: true,
        defaultValue: 'Variable',
        showAsMainLabel: true, // Show as main text on node
        editorType: 'text'
      },
      {
        dataKey: 'value',
        label: 'Value',
        editable: true,
        defaultValue: '',
        showAsTooltip: true,
        editorType: 'formula'
      },
      {
        dataKey: 'note',
        label: 'Note',
        editable: true,
        defaultValue: '',
        showAsTooltip: true,
        editorType: 'text'
      }
    ],
    
    manuallyCreatable: true
  },
  {
    id: 'Converter',
    label: 'Converter',
    description: 'Converter node - lookup table that converts input to output values',
    
    style: {
      shape: 'Hexagon',
      fill: '#9FC5AB',
      stroke: '#6B9080',
      strokeWidth: 2,
      width: 140,
      height: 70,
      textColor: 'black',
      font: 'bold 14px sans-serif',
      textEditable: true,
      defaultText: 'Converter'
    },
    
    port: {
      showCenterPort: true,
      centerPortFill: '#6B9080',
      centerPortStroke: '#4A6F5F',
      centerPortSize: 20,
      fromLinkable: true,
      toLinkable: true
    },
    
    displayProperties: [
      {
        dataKey: 'name',
        label: 'Name',
        editable: true,
        defaultValue: 'Converter',
        showAsMainLabel: true, // Show as main text on node
        editorType: 'text'
      },
      {
        dataKey: 'interpolation',
        label: 'Interpolation',
        editable: true,
        defaultValue: 'Linear',
        showAsTooltip: true,
        editorType: 'singleReference',
        defaultOptions: [
          { value: 'Linear', label: 'Linear' },
          { value: 'Discrete', label: 'Discrete' }
        ]
      },
      {
        dataKey: 'input',
        label: 'Input Source',
        editable: true,
        defaultValue: 'Time',
        showAsTooltip: true,
        editorType: 'singleReference',
        dynamicOptions: 'references',
        defaultOptions: [
          { value: 'Time', label: 'Time' }
        ]
      },
      {
        dataKey: 'values',
        label: 'Data Points',
        editable: true,
        defaultValue: '0,0;1,1;2,2',
        showAsTooltip: true,
        editorType: 'table'
      },
      {
        dataKey: 'note',
        label: 'Note',
        editable: true,
        defaultValue: '',
        showAsTooltip: true,
        editorType: 'text'
      }
    ],
    
    manuallyCreatable: true
  },
  {
    id: 'Cloud',
    label: 'Cloud',
    description: 'Cloud node - automatically created endpoint for flows',
    
    style: {
      shape: 'FlowCloud',
      fill: 'white',
      stroke: '#4A90E2',
      strokeWidth: 2,
      width: 80,
      height: 64,
      textColor: '#4A90E2',
      font: 'bold 12px sans-serif',
      textEditable: true,
      defaultText: ''
    },
    
    port: {
      showCenterPort: false, // Cloud has no visible center port
      fromLinkable: false, // Cannot initiate links
      toLinkable: false // Cannot initiate links (but can be target/source when reversing)
    },
    
    displayProperties: [], // No editable properties for Cloud
    
    manuallyCreatable: false, // Cloud is only created automatically
    selectConnectedLinksOnClick: true // Select Cloud + its links when clicked
  }
];

/**
 * Get configuration for a specific node type
 */
export function getNodeConfiguration(nodeType: NodeType): NodeConfiguration | undefined {
  return NODE_CONFIGURATIONS.find(config => config.id === nodeType);
}

/**
 * Get all manually creatable node types (for UI, sidebar, etc.)
 */
export function getManuallyCreatableNodeTypes(): ManuallyCreatableNodeType[] {
  return NODE_CONFIGURATIONS
    .filter(config => config.manuallyCreatable)
    .map(config => config.id) as ManuallyCreatableNodeType[];
}

