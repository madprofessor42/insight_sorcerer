import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as go from 'gojs';
import type { LinkType } from '../config/diagram-rules';
import { DEFAULT_LINK_TYPE } from '../config/diagram-rules';

interface DiagramState {
  // GoJS model data - synced from diagram
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  // CRITICAL: Flag to prevent circular updates between GoJS and Redux
  // When true, ReactDiagram will skip updating the diagram (GoJS already has the changes)
  skipsDiagramUpdate: boolean;
  // UI state
  selectedLinkType: LinkType;
  // Selected node key (actual data comes from nodeDataArray)
  selectedNodeKey: go.Key | null;
  // Selected edge key (actual data comes from linkDataArray)
  selectedEdgeKey: go.Key | null;
}

const initialState: DiagramState = {
  nodeDataArray: [],
  linkDataArray: [],
  modelData: {},
  skipsDiagramUpdate: false,
  selectedLinkType: DEFAULT_LINK_TYPE,
  selectedNodeKey: null,
  selectedEdgeKey: null,
};

// Helper functions for immutable array updates
function insertItem(array: Array<go.ObjectData>, data: go.ObjectData): Array<go.ObjectData> {
  return [...array, data];
}

function modifyItem(array: Array<go.ObjectData>, index: number, data: go.ObjectData): Array<go.ObjectData> {
  return array.map((item, idx) => idx === index ? data : item);
}

function removeItems(array: Array<go.ObjectData>, keys: Array<go.Key>): Array<go.ObjectData> {
  return array.filter(item => !keys.includes(item.key));
}

export const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    // Node operations - incremental updates
    insertNode: (state, action: PayloadAction<go.ObjectData>) => {
      state.nodeDataArray = insertItem(state.nodeDataArray, action.payload);
    },
    
    modifyNode: (state, action: PayloadAction<{ index: number; data: go.ObjectData }>) => {
      state.nodeDataArray = modifyItem(state.nodeDataArray, action.payload.index, action.payload.data);
    },
    
    removeNodes: (state, action: PayloadAction<Array<go.Key>>) => {
      state.nodeDataArray = removeItems(state.nodeDataArray, action.payload);
    },

    // Link operations - incremental updates
    insertLink: (state, action: PayloadAction<go.ObjectData>) => {
      state.linkDataArray = insertItem(state.linkDataArray, action.payload);
    },
    
    modifyLink: (state, action: PayloadAction<{ index: number; data: go.ObjectData }>) => {
      state.linkDataArray = modifyItem(state.linkDataArray, action.payload.index, action.payload.data);
    },
    
    removeLinks: (state, action: PayloadAction<Array<go.Key>>) => {
      state.linkDataArray = removeItems(state.linkDataArray, action.payload);
    },

    // Model data operations
    modifyModel: (state, action: PayloadAction<go.ObjectData>) => {
      state.modelData = action.payload;
    },

    // CRITICAL: Control circular update prevention
    // Set to true when changes come FROM GoJS (so we don't send them back)
    // Set to false when changes come FROM Redux (so GoJS gets updated)
    setSkips: (state, action: PayloadAction<boolean>) => {
      state.skipsDiagramUpdate = action.payload;
    },

    // Clear all diagram data
    clearDiagram: (state) => {
      state.nodeDataArray = [];
      state.linkDataArray = [];
      state.modelData = {};
      state.skipsDiagramUpdate = false;
    },

    // Set selected link type
    setLinkType: (state, action: PayloadAction<LinkType>) => {
      state.selectedLinkType = action.payload;
    },

    // Set selected node key (data comes from nodeDataArray)
    setSelectedNodeKey: (state, action: PayloadAction<go.Key | null>) => {
      state.selectedNodeKey = action.payload;
    },

    // Clear selected node
    clearSelectedNode: (state) => {
      state.selectedNodeKey = null;
    },

    // Set selected edge key (data comes from linkDataArray)
    setSelectedEdgeKey: (state, action: PayloadAction<go.Key | null>) => {
      state.selectedEdgeKey = action.payload;
    },

    // Clear selected edge
    clearSelectedEdge: (state) => {
      state.selectedEdgeKey = null;
    },
  },
});

export const { 
  insertNode,
  modifyNode,
  removeNodes,
  insertLink,
  modifyLink,
  removeLinks,
  modifyModel,
  setSkips,
  clearDiagram,
  setLinkType,
  setSelectedNodeKey,
  clearSelectedNode,
  setSelectedEdgeKey,
  clearSelectedEdge
} = diagramSlice.actions;

export default diagramSlice.reducer;

