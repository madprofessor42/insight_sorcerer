# Hooks Organization

This directory contains custom React hooks organized by functionality.

## Structure

```
hooks/
├── diagram/          # Diagram-related hooks
│   ├── useDiagramDragDrop.ts      # Drag & drop from palette to diagram
│   ├── useDiagramEvents.ts        # Diagram event listeners management
│   ├── useDiagramModelSync.ts     # Sync diagram model with Redux
│   └── useDiagramSelection.ts     # Handle diagram selection events
│
├── edge/             # Edge/Link-related hooks
│   ├── useEdgeOperations.ts       # Edge manipulation operations (reset, reverse, toggle)
│   ├── useEdgeValidation.ts       # Edge validation logic
│   └── useLinkManagement.ts       # Link creation and management
│
├── tools/            # Custom GoJS tools
│   └── useCustomLinkingTool.ts    # Custom linking tool configuration
│
└── palette/          # Palette-related hooks
    └── usePaletteDragDrop.ts      # Drag & drop from palette

```

## Usage

All hooks are re-exported from the main `hooks/index.ts` file, so you can import them directly:

```typescript
// Import from the main hooks directory
import { useDiagramSelection, useEdgeOperations } from '../../hooks';

// Or import from specific subdirectories
import { useDiagramSelection } from '../../hooks/diagram/useDiagramSelection';
import { useEdgeOperations } from '../../hooks/edge/useEdgeOperations';
```

## Categories

### Diagram Hooks
Manage diagram-level functionality including events, model synchronization, selection, and drag-drop interactions.

### Edge Hooks
Handle edge/link operations, validation, and management within the diagram.

### Tools Hooks
Custom GoJS tools configuration and initialization.

### Palette Hooks
Manage interactions with the node palette, including drag-and-drop functionality.

