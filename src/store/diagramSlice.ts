import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as go from 'gojs';

export type LinkType = 'link' | 'flow';

interface DiagramState {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  skipsDiagramUpdate: boolean;
  selectedLinkType: LinkType;
}

const initialState: DiagramState = {
  nodeDataArray: [],
  linkDataArray: [],
  modelData: {},
  skipsDiagramUpdate: false,
  selectedLinkType: 'link',
};

export const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    // Sync all data from GoJS model (called from handleModelChange)
    // BEST PRACTICE: GoJS model is the single source of truth
    // Redux just mirrors it for React components
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

    // Set selected link type
    setLinkType: (state, action: PayloadAction<LinkType>) => {
      state.selectedLinkType = action.payload;
    },
  },
});

export const { 
  syncFromGoJS, 
  resetSkipFlag, 
  clearDiagram,
  setLinkType 
} = diagramSlice.actions;

export default diagramSlice.reducer;

