import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useEdgeOperations, useEdgeValidation } from '../../../hooks/edge';
import { normalizeLinkType, getLinkConfiguration } from '../../../config/diagram-rules';
import styles from './EdgePanel.module.css';

export function EdgePanel() {
  // Get selected edge key and find actual data in linkDataArray
  // This way selectedEdge is ALWAYS in sync with GoJS state
  const selectedEdgeKey = useAppSelector((state) => state.diagram.selectedEdgeKey);
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

  // Update local UI state when selected edge changes
  useEffect(() => {
    if (selectedEdge) {
      setBidirectionalActive(selectedEdge.bidirectional === true);
      
      // Initialize property values from selectedEdge
      const linkType = normalizeLinkType(selectedEdge.category);
      const config = getLinkConfiguration(linkType);
      if (config) {
        const values: Record<string, string> = {};
        config.displayProperties.forEach(prop => {
          values[prop.dataKey] = (selectedEdge[prop.dataKey] as string) || prop.defaultValue || '';
        });
        setPropertyValues(values);
      }
    }
  }, [selectedEdge]);

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
        <div className={styles.edgeProperties}>
          <h3 className={styles.propertiesTitle}>Свойства</h3>
          {config.displayProperties.map(prop => (
            <div key={prop.dataKey} className={styles.propertyField}>
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
    </section>
  );
}

