import './Palette.css';

interface PaletteProps {
  onDragStart?: (nodeType: string) => void;
}

export const Palette = (props: PaletteProps) => {
  const handleDragStart = (e: React.DragEvent, nodeType: string, nodeData: any) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.setData('nodeData', JSON.stringify(nodeData));
    e.dataTransfer.effectAllowed = 'copy';
    if (props.onDragStart) {
      props.onDragStart(nodeType);
    }
  };

  return (
    <div className="palette-container">
      <h2>Components</h2>
      <div className="palette-items">
        <div
          className="palette-item stock-item"
          draggable
          onDragStart={(e) => handleDragStart(e, 'Stock', { 
            category: 'Stock', 
            name: 'Stock' 
          })}
        >
          <div className="stock-shape">
            <span>Stock</span>
          </div>
        </div>
        
        <div
          className="palette-item variable-item"
          draggable
          onDragStart={(e) => handleDragStart(e, 'Variable', { 
            category: 'Variable', 
            name: 'Variable' 
          })}
        >
          <div className="variable-shape">
            <span>Variable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

