import { configureStore } from '@reduxjs/toolkit';
import diagramReducer from './diagramSlice';

export const store = configureStore({
  reducer: {
    diagram: diagramReducer,
  },
  // GoJS-specific objects are now cleaned before dispatch in useDiagramModelSync
  // So we can keep default serializability checks enabled for safety
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

