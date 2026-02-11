/**
 * Hook for auto-saving diagram to localStorage on every change
 * 
 * Uses GoJS's isTransactionFinished event to detect when model changes complete.
 * Automatically saves to localStorage for persistence across page reloads.
 */

import { useEffect, useRef } from 'react';
import { type RefObject } from 'react';
import { type DiagramHandle } from '../../components/Diagram';

const AUTO_SAVE_KEY = 'autoSavedDiagram';
const AUTO_SAVE_SIMULATION_KEY = 'autoSavedSimulationConfig';
const RESTORE_FLAG_KEY = 'isRestoringDiagram';

/**
 * Enable auto-save for diagram
 * Saves model to localStorage on every transaction completion
 */
export function useDiagramAutoSave(diagramRef: RefObject<DiagramHandle | null>) {
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const diagram = diagramRef.current?.getDiagram();
    if (!diagram) return;

    // Wait a bit to ensure diagram is fully initialized
    const initTimer = setTimeout(() => {
      isInitializedRef.current = true;
    }, 500);

    // Listen for model changes and auto-save
    const handleModelChanged = (evt: any) => {
      // Only save when transaction is finished (not during intermediate steps)
      if (evt.isTransactionFinished) {
        // Don't auto-save during restoration or before initialization
        const isRestoring = sessionStorage.getItem(RESTORE_FLAG_KEY) === 'true';
        if (isRestoring || !isInitializedRef.current) {
          return;
        }

        try {
          const modelJson = diagram.model.toJson();
          localStorage.setItem(AUTO_SAVE_KEY, modelJson);
          console.log('🔄 Auto-saved diagram');
        } catch (err) {
          console.error('Failed to auto-save diagram:', err);
        }
      }
    };

    diagram.addModelChangedListener(handleModelChanged);

    return () => {
      clearTimeout(initTimer);
      diagram.removeModelChangedListener(handleModelChanged);
    };
  }, [diagramRef]);
}

/**
 * Load auto-saved diagram from localStorage
 * Returns the model JSON string or null if not found
 */
export function loadAutoSavedDiagram(): string | null {
  try {
    // Set restoration flag to prevent auto-save during load
    sessionStorage.setItem(RESTORE_FLAG_KEY, 'true');
    return localStorage.getItem(AUTO_SAVE_KEY);
  } catch (err) {
    console.error('Failed to load auto-saved diagram:', err);
    return null;
  }
}

/**
 * Mark restoration as complete
 * Allows auto-save to resume
 */
export function finishRestoration(): void {
  // Clear flag after a small delay to ensure all React updates complete
  setTimeout(() => {
    sessionStorage.removeItem(RESTORE_FLAG_KEY);
  }, 1000);
}

/**
 * Clear auto-saved diagram from localStorage
 */
export function clearAutoSavedDiagram(): void {
  try {
    localStorage.removeItem(AUTO_SAVE_KEY);
    localStorage.removeItem(AUTO_SAVE_SIMULATION_KEY);
  } catch (err) {
    console.error('Failed to clear auto-saved diagram:', err);
  }
}

/**
 * Save simulation config to localStorage
 */
export function saveSimulationConfig(config: any): void {
  try {
    localStorage.setItem(AUTO_SAVE_SIMULATION_KEY, JSON.stringify(config));
    console.log('💾 Saved simulation config to localStorage:', config);
  } catch (err) {
    console.error('Failed to save simulation config:', err);
  }
}

/**
 * Load simulation config from localStorage
 */
export function loadSimulationConfig(): any | null {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_SIMULATION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.error('Failed to load simulation config:', err);
    return null;
  }
}

