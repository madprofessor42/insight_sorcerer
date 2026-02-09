import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as go from 'gojs';

interface DiagramState {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  skipsDiagramUpdate: boolean;
}

const initialState: DiagramState = {
  nodeDataArray: [],
  linkDataArray: [],
  modelData: {},
  skipsDiagramUpdate: false,
};

export const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    // Sync all data from GoJS model (called from handleModelChange)
    syncFromGoJS: (state, action: PayloadAction<{
      nodes: Array<go.ObjectData>;
      links: Array<go.ObjectData>;
      modelData?: go.ObjectData;
    }>) => {
      state.nodeDataArray = action.payload.nodes;
      state.linkDataArray = action.payload.links;
      if (action.payload.modelData) {
        state.modelData = action.payload.modelData;
      }
      // Skip next diagram update since GoJS already has these changes
      state.skipsDiagramUpdate = true;
    },

    // Add node from palette drop
    addNode: (state, action: PayloadAction<{
      nodeData: go.ObjectData;
      allNodes: Array<go.ObjectData>;
    }>) => {
      // Use current nodes from GoJS to preserve positions
      state.nodeDataArray = [...action.payload.allNodes, action.payload.nodeData];
      state.skipsDiagramUpdate = false;
    },

    // Reset skipsDiagramUpdate flag
    resetSkipFlag: (state) => {
      state.skipsDiagramUpdate = false;
    },

    // Clear all diagram data
    clearDiagram: (state) => {
      state.nodeDataArray = [];
      state.linkDataArray = [];
      state.modelData = {};
      state.skipsDiagramUpdate = false;
    },
  },
});

export const { 
  syncFromGoJS, 
  addNode, 
  resetSkipFlag, 
  clearDiagram 
} = diagramSlice.actions;

export default diagramSlice.reducer;

