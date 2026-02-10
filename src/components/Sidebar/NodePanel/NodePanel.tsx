import { useEffect, useState } from 'react';
import * as go from 'gojs';
import { useAppSelector } from '../../../store/hooks';
import { getNodeConfiguration } from '../../../config/diagram-rules';
import { useNodeOperations } from '../../../hooks/node/useNodeOperations';
import type { NodeType } from '../../../config/diagram-rules';
import styles from './NodePanel.module.css';

export function NodePanel() {
  const selectedNodeKey = useAppSelector((state) => state.diagram.selectedNodeKey);
  const nodeDataArray = useAppSelector((state) => state.diagram.nodeDataArray);
  const selectedNode = selectedNodeKey
    ? nodeDataArray.find(node => node.key === selectedNodeKey)
    : null;

  const { updateNodeProperty } = useNodeOperations();
  const [propertyValues, setPropertyValues] = useState<Record<string, string>>({});
  const [previousNodeKey, setPreviousNodeKey] = useState<go.Key | null>(null);

  // When deselecting node, replace empty values with defaults
  useEffect(() => {
    // Check if we just deselected a node (had a key, now null)
    if (previousNodeKey !== null && selectedNodeKey === null) {
      // Find the previously selected node in the array
      const prevNode = nodeDataArray.find(node => node.key === previousNodeKey);
      if (prevNode) {
        const nodeType = prevNode.category as NodeType;
        const config = getNodeConfiguration(nodeType);
        if (config && config.displayProperties && config.displayProperties.length > 0) {
          config.displayProperties.forEach(prop => {
            const currentValue = prevNode[prop.dataKey];
            const defaultValue = prop.defaultValue ?? '';
            
            // If property is empty and has default, update GoJS model
            if (!currentValue && defaultValue) {
              updateNodeProperty(prevNode.key, prop.dataKey, defaultValue);
            }
          });
        }
      }
    }
    
    // Update previous key for next comparison
    setPreviousNodeKey(selectedNodeKey);
  }, [selectedNodeKey, previousNodeKey, nodeDataArray, updateNodeProperty]);

  // Initialize property values ONLY when selection changes (not when properties update)
  // This prevents overwriting user input while they're typing
  useEffect(() => {
    if (selectedNodeKey && selectedNode) {
      const nodeType = selectedNode.category as NodeType;
      const config = getNodeConfiguration(nodeType);
      if (config && config.displayProperties && config.displayProperties.length > 0) {
        const values: Record<string, string> = {};
        config.displayProperties.forEach(prop => {
          const currentValue = selectedNode[prop.dataKey];
          values[prop.dataKey] = (currentValue ?? '') as string;
        });
        setPropertyValues(values);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeKey]); // Only depend on KEY change, not on node data updates

  if (!selectedNode) {
    return null;
  }

  const nodeType = selectedNode.category as NodeType;
  const config = getNodeConfiguration(nodeType);

  // Don't show panel if no config or no editable properties
  if (!config || !config.displayProperties || config.displayProperties.length === 0) {
    return null;
  }

  const handlePropertyChange = (dataKey: string, value: string) => {
    setPropertyValues(prev => ({ ...prev, [dataKey]: value }));
    updateNodeProperty(selectedNode.key, dataKey, value);
  };

  return (
    <section className={styles.nodePanel}>
      <h2 className={styles.title}>Элемент</h2>
      
      <div className={styles.content}>
        {/* Node Info */}
        <div className={styles.nodeInfo}>
          <p className={styles.nodeType}>
            Тип: {nodeType}
          </p>
          {selectedNode.key !== undefined && (
            <p className={styles.nodeId}>
              ID: {selectedNode.key}
            </p>
          )}
          {config.description && (
            <p className={styles.nodeDescription}>
              {config.description}
            </p>
          )}
        </div>

        {/* Node Properties Form */}
        {config.displayProperties.map(prop => (
          <div key={prop.dataKey} className={styles.fieldGroup}>
            <label className={styles.propertyLabel} htmlFor={`prop-${prop.dataKey}`}>
              {prop.label}
            </label>
            <input
              id={`prop-${prop.dataKey}`}
              type="text"
              className={styles.propertyInput}
              value={propertyValues[prop.dataKey] || ''}
              onChange={(e) => handlePropertyChange(prop.dataKey, e.target.value)}
              disabled={!prop.editable}
              placeholder={prop.defaultValue || `Введите ${prop.label.toLowerCase()}...`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

