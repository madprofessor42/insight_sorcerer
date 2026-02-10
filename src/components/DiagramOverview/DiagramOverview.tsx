import * as go from 'gojs';
import { ReactOverview } from 'gojs-react';
import './DiagramOverview.css';

interface DiagramOverviewProps {
  observedDiagram: go.Diagram | null;
}

/**
 * DiagramOverview component - displays a minimap of the main diagram
 * Provides quick navigation for large diagrams
 */
export function DiagramOverview(props: DiagramOverviewProps) {
  // Initialize Overview with basic configuration
  const initOverview = (): go.Overview => {
    const overview = new go.Overview();
    
    // Configure overview appearance and behavior
    overview.contentAlignment = go.Spot.Center;
    
    // Box that shows the current viewport (using modern GoJS 2.2+ syntax)
    overview.box.selectionAdornmentTemplate = new go.Adornment('Auto')
      .add(
        new go.Shape({ fill: null, stroke: 'dodgerblue', strokeWidth: 2 })
      )
      .add(
        new go.Placeholder({ margin: 2 })
      );
    
    return overview;
  };

  return (
    <ReactOverview
      divClassName="overview-component"
      initOverview={initOverview}
      observedDiagram={props.observedDiagram}
    />
  );
}

