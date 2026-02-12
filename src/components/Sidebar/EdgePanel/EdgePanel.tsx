import { useState, useEffect, useMemo } from 'react';
import * as go from 'gojs';
import { useAppSelector } from '../../../store/hooks';
import { useEdgeOperations, useEdgeValidation } from '../../../hooks/edge';
import { normalizeLinkType, getLinkConfiguration, getLinkReferenceConfig } from '../../../config';
import { FormulaInput } from '../../Formula';
import { getAvailableReferencesForEdge } from '../../../utils/diagram-data';
import styles from './EdgePanel.module.css';

export function EdgePanel() {
  // Get selected edge key and find actual data in linkDataArray
  // This way selectedEdge is ALWAYS in sync with GoJS state
  const selectedEdgeKey = useAppSelector((state) => state.diagram.selectedEdgeKey);
  const nodeDataArray = useAppSelector((state) => state.diagram.nodeDataArray);
  const linkDataArray = useAppSelector((state) => state.diagram.linkDataArray);
  const selectedEdge = selectedEdgeKey 
    ? linkDataArray.find(link => link.key === selectedEdgeKey) 
    : null;
  
  const { resetCurve, reverseDirection, toggleBidirectional, updateEdgeProperty } = useEdgeOperations();
  const { 
    canReverse, 
    reverseReason, 
    canBeBidirectional, 
    bidirectionalReason 
  } = useEdgeValidation(selectedEdge);
  
  // Local state for responsive UI
  const [bidirectionalActive, setBidirectionalActive] = useState(false);
  const [propertyValues, setPropertyValues] = useState<Record<string, string>>({});
  const [previousEdgeKey, setPreviousEdgeKey] = useState<go.Key | null>(null);

  // Get available references for formula inputs
  const availableReferences = useMemo(() => {
    if (!selectedEdge) return [];
    const linkType = normalizeLinkType(selectedEdge.category);
    
    // Get reference config for this edge type
    // For now, use the first formula property (typically flowRate for flow)
    const config = getLinkConfiguration(linkType);
    const formulaProp = config?.displayProperties.find(prop => prop.editorType === 'formula');
    
    if (!formulaProp) return [];
    
    const refConfig = getLinkReferenceConfig(linkType, formulaProp.dataKey);
    if (!refConfig) return [];
    
    return getAvailableReferencesForEdge(
      selectedEdge,
      nodeDataArray,
      linkDataArray,
      refConfig
    );
  }, [selectedEdge, nodeDataArray, linkDataArray]);

  // When deselecting edge, replace empty values with defaults
  useEffect(() => {
    // Check if we just deselected an edge (had a key, now null)
    if (previousEdgeKey !== null && selectedEdgeKey === null) {
      // Find the previously selected edge in the array
      const prevEdge = linkDataArray.find(link => link.key === previousEdgeKey);
      if (prevEdge) {
        const linkType = normalizeLinkType(prevEdge.category);
        const config = getLinkConfiguration(linkType);
        if (config) {
          config.displayProperties.forEach(prop => {
            const currentValue = prevEdge[prop.dataKey];
            const defaultValue = prop.defaultValue ?? '';
            
            // If property is empty and has default, update GoJS model
            if (!currentValue && defaultValue) {
              updateEdgeProperty(prevEdge.key, prop.dataKey, defaultValue);
            }
          });
        }
      }
    }
    
    // Update previous key for next comparison
    setPreviousEdgeKey(selectedEdgeKey);
  }, [selectedEdgeKey, previousEdgeKey, linkDataArray, updateEdgeProperty]);

  // Initialize property values when selection changes
  useEffect(() => {
    if (selectedEdgeKey && selectedEdge) {
      setBidirectionalActive(selectedEdge.bidirectional === true);
      
      // Initialize property values from selectedEdge
      const linkType = normalizeLinkType(selectedEdge.category);
      const config = getLinkConfiguration(linkType);
      if (config) {
        const values: Record<string, string> = {};
        config.displayProperties.forEach(prop => {
          const currentValue = selectedEdge[prop.dataKey];
          values[prop.dataKey] = (currentValue ?? '') as string;
        });
        setPropertyValues(values);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEdgeKey]); // Only depend on KEY change, not on edge data updates
  
  // Sync property values when edge data changes externally (e.g., inline editing)
  // But preserve local values that user is currently editing
  useEffect(() => {
    if (selectedEdgeKey && selectedEdge) {
      // Sync bidirectional state
      if (selectedEdge.bidirectional !== bidirectionalActive) {
        setBidirectionalActive(selectedEdge.bidirectional === true);
      }
      
      // Sync property values
      const linkType = normalizeLinkType(selectedEdge.category);
      const config = getLinkConfiguration(linkType);
      if (config) {
        setPropertyValues(prevValues => {
          const newValues = { ...prevValues };
          let hasChanges = false;
          
          config.displayProperties.forEach(prop => {
            const currentValue = selectedEdge[prop.dataKey];
            const normalizedValue = (currentValue ?? '') as string;
            
            // Only update if value changed externally
            if (normalizedValue !== prevValues[prop.dataKey]) {
              newValues[prop.dataKey] = normalizedValue;
              hasChanges = true;
            }
          });
          
          // Only trigger state update if something actually changed
          return hasChanges ? newValues : prevValues;
        });
      }
    }
  }, [selectedEdge, selectedEdgeKey, bidirectionalActive]);

  if (!selectedEdge) {
    return null;
  }

  const linkType = normalizeLinkType(selectedEdge.category);
  const config = getLinkConfiguration(linkType);

  const handleToggleBidirectional = () => {
    toggleBidirectional(selectedEdge);
    setBidirectionalActive(!bidirectionalActive);
  };

  const handlePropertyChange = (dataKey: string, value: string) => {
    // Update local state immediately for responsive UI
    setPropertyValues(prev => ({ ...prev, [dataKey]: value }));
    
    // Update GoJS model using centralized operation
    // This follows best practices: GoJS → onModelChange → Redux sync
    updateEdgeProperty(selectedEdge.key, dataKey, value);
  };

  return (
    <section className={styles.edgePanel}>
      <h2 className={styles.title}>Связь</h2>
      
      <div className={styles.content}>
        {/* Edge Info */}
        <div className={styles.edgeInfo}>
          <p className={styles.edgeType}>
            Тип: {linkType}
          </p>
          {selectedEdge.key && (
            <p className={styles.edgeId}>
              ID: {selectedEdge.key}
            </p>
          )}
        </div>

        {/* Edge Properties Form */}
        {config && config.displayProperties.length > 0 && (
          <>
            {config.displayProperties.map(prop => {
              // Use FormulaInput for formula type fields
              if (prop.editorType === 'formula') {
                return (
                  <div key={prop.dataKey} className={styles.fieldGroup}>
                    <FormulaInput
                      id={`prop-${prop.dataKey}`}
                      label={prop.label}
                      value={propertyValues[prop.dataKey] || ''}
                      onChange={(value) => handlePropertyChange(prop.dataKey, String(value || ''))}
                      availableReferences={availableReferences}
                      placeholder={prop.defaultValue || `Введите ${prop.label.toLowerCase()}...`}
                    />
                  </div>
                );
              }
              
              // Use regular input for text fields
              return (
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
              );
            })}
          </>
        )}

        {/* Edge Actions */}
        <div className={styles.edgeActions}>
          <button
            className={styles.edgeActionButton}
            onClick={() => resetCurve(selectedEdge)}
            title="Сбросить изгиб связи"
          >
            <span className={styles.edgeActionIcon}>🔄</span>
            <span className={styles.edgeActionLabel}>Сбросить изгиб</span>
          </button>

          <button
            className={styles.edgeActionButton}
            onClick={() => reverseDirection(selectedEdge)}
            disabled={!canReverse}
            title={reverseReason}
          >
            <span className={styles.edgeActionIcon}>↔️</span>
            <span className={styles.edgeActionLabel}>Развернуть</span>
          </button>

          <button
            className={`${styles.edgeActionButton} ${bidirectionalActive ? styles.active : ''}`}
            onClick={handleToggleBidirectional}
            disabled={!canBeBidirectional}
            title={bidirectionalReason}
          >
            <span className={styles.edgeActionIcon}>⇄</span>
            <span className={styles.edgeActionLabel}>Двунаправленная</span>
          </button>
        </div>
      </div>
    </section>
  );
}

