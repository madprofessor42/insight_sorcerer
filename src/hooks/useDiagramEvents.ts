import { useEffect } from 'react';
import * as go from 'gojs';
import type { ReactDiagram } from 'gojs-react';

/**
 * Hook to manage diagram event listeners
 */
export function useDiagramEvents(
  diagramRef: React.RefObject<ReactDiagram | null>,
  onDiagramEvent: (e: go.DiagramEvent) => void
) {
  useEffect(() => {
    if (diagramRef.current === null) return;
    const diagram = diagramRef.current.getDiagram();
    if (diagram instanceof go.Diagram) {
      diagram.addDiagramListener('ChangedSelection', onDiagramEvent);
    }
    return () => {
      if (diagram instanceof go.Diagram) {
        diagram.removeDiagramListener('ChangedSelection', onDiagramEvent);
      }
    };
  }, [diagramRef, onDiagramEvent]);
}

