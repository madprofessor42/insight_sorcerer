import { configureStore } from '@reduxjs/toolkit';
import diagramReducer from './diagramSlice';

export const store = configureStore({
  reducer: {
    diagram: diagramReducer,
  },
  // Disable serializability check for GoJS objects
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state
        ignoredActions: ['diagram/syncFromGoJS', 'diagram/addNode'],
        ignoredPaths: ['diagram.nodeDataArray', 'diagram.linkDataArray', 'diagram.modelData'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

