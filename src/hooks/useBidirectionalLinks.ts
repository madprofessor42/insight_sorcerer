import { useEffect } from 'react';
import * as go from 'gojs';
import type { ReactDiagram } from 'gojs-react';

/**
 * Hook to automatically convert links to bidirectional when reverse link is created
 */
export function useBidirectionalLinks(
  diagramRef: React.RefObject<ReactDiagram | null>
) {
  useEffect(() => {
    if (diagramRef.current === null) return;
    const diagram = diagramRef.current.getDiagram();
    if (!(diagram instanceof go.Diagram)) return;

    const handleLinkDrawn = (e: go.DiagramEvent) => {
      const link = e.subject as go.Link;
      if (!link || !(link instanceof go.Link)) return;

      const model = diagram.model as go.GraphLinksModel;
      if (!(model instanceof go.GraphLinksModel)) return;

      const fromKey = link.data.from;
      const toKey = link.data.to;

      // Check if reverse link exists
      const reverseLink = model.linkDataArray.find(
        (ld: go.ObjectData) => 
          ld.from === toKey && 
          ld.to === fromKey && 
          ld.key !== link.data.key // Don't find the same link
      );

      if (reverseLink) {
        diagram.startTransaction('convert to bidirectional');
        
        // Remove the newly created link
        model.removeLinkData(link.data);
        
        // Make the existing reverse link bidirectional
        model.setDataProperty(reverseLink, 'bidirectional', true);
        
        diagram.commitTransaction('convert to bidirectional');
      }
    };

    diagram.addDiagramListener('LinkDrawn', handleLinkDrawn);

    return () => {
      if (diagram instanceof go.Diagram) {
        diagram.removeDiagramListener('LinkDrawn', handleLinkDrawn);
      }
    };
  }, [diagramRef]);
}

