import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as go from 'gojs';

export type LinkType = 'link' | 'flow';

interface DiagramState {
  // Store diagram data for persistence/export (not for controlling GoJS!)
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  selectedLinkType: LinkType;
}

const initialState: DiagramState = {
  nodeDataArray: [],
  linkDataArray: [],
  modelData: {},
  selectedLinkType: 'link',
};

export const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    // Sync all data from GoJS model (called from handleModelChange)
    // BEST PRACTICE: GoJS model is the single source of truth
    // Redux just mirrors it for persistence/export/display
    // We DON'T pass this data back to GoJS!
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
    },

    // Clear all diagram data
    clearDiagram: (state) => {
      state.nodeDataArray = [];
      state.linkDataArray = [];
      state.modelData = {};
    },

    // Set selected link type
    setLinkType: (state, action: PayloadAction<LinkType>) => {
      state.selectedLinkType = action.payload;
    },
  },
});

export const { 
  syncFromGoJS, 
  clearDiagram,
  setLinkType 
} = diagramSlice.actions;

export default diagramSlice.reducer;

