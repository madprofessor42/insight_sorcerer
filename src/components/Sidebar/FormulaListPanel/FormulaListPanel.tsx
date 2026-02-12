import { useState, useMemo } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { getNodeConfiguration, getLinkConfiguration, normalizeLinkType, getTypeColor } from '../../../config';
import type { NodeType } from '../../../config';
import { FormulaEditorModal } from '../../Formula/FormulaEditorModal';
import { getAvailableReferences, getAvailableReferencesForEdge } from '../../../utils/diagram-data';
import { getNodeReferenceConfig, getLinkReferenceConfig } from '../../../config';
import { useNodeOperations } from '../../../hooks/node/useNodeOperations';
import { useEdgeOperations } from '../../../hooks/edge';
import styles from './FormulaListPanel.module.css';

interface FormulaItem {
  type: 'node' | 'edge';
  key: string | number;
  name: string;
  category: string;
  propertyKey: string;
  propertyLabel: string;
  value: string | number | undefined;
}

export function FormulaListPanel() {
  const nodeDataArray = useAppSelector((state) => state.diagram.nodeDataArray);
  const linkDataArray = useAppSelector((state) => state.diagram.linkDataArray);
  const selectedNodeKey = useAppSelector((state) => state.diagram.selectedNodeKey);
  const selectedEdgeKey = useAppSelector((state) => state.diagram.selectedEdgeKey);
  
  const { updateNodeProperty } = useNodeOperations();
  const { updateEdgeProperty } = useEdgeOperations();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingItem, setEditingItem] = useState<FormulaItem | null>(null);

  // Collect all nodes and edges that have formula properties
  const formulaItems = useMemo(() => {
    const items: FormulaItem[] = [];

    // Collect nodes with formulas
    nodeDataArray.forEach((node) => {
      const nodeType = node.category as NodeType;
      const config = getNodeConfiguration(nodeType);
      
      if (config && config.displayProperties) {
        config.displayProperties.forEach((prop) => {
          if (prop.editorType === 'formula') {
            items.push({
              type: 'node',
              key: node.key,
              name: node.name || `${nodeType} ${node.key}`,
              category: nodeType,
              propertyKey: prop.dataKey,
              propertyLabel: prop.label,
              value: node[prop.dataKey],
            });
          }
        });
      }
    });

    // Collect edges with formulas
    linkDataArray.forEach((link) => {
      const linkType = normalizeLinkType(link.category);
      const config = getLinkConfiguration(linkType);
      
      if (config && config.displayProperties) {
        config.displayProperties.forEach((prop) => {
          if (prop.editorType === 'formula') {
            items.push({
              type: 'edge',
              key: link.key,
              name: link.text || `${linkType} ${link.key}`,
              category: linkType,
              propertyKey: prop.dataKey,
              propertyLabel: prop.label,
              value: link[prop.dataKey],
            });
          }
        });
      }
    });

    return items;
  }, [nodeDataArray, linkDataArray]);

  // Get available references for the currently editing item
  const availableReferences = useMemo(() => {
    if (!editingItem) return [];

    if (editingItem.type === 'node') {
      const node = nodeDataArray.find(n => n.key === editingItem.key);
      if (!node) return [];
      
      const nodeType = node.category as NodeType;
      const refConfig = getNodeReferenceConfig(nodeType, editingItem.propertyKey);
      
      if (!refConfig) return [];
      
      return getAvailableReferences(
        node.key,
        nodeDataArray,
        linkDataArray,
        refConfig
      );
    } else {
      const edge = linkDataArray.find(l => l.key === editingItem.key);
      if (!edge) return [];
      
      const linkType = normalizeLinkType(edge.category);
      const refConfig = getLinkReferenceConfig(linkType, editingItem.propertyKey);
      
      if (!refConfig) return [];
      
      return getAvailableReferencesForEdge(
        edge,
        nodeDataArray,
        linkDataArray,
        refConfig
      );
    }
  }, [editingItem, nodeDataArray, linkDataArray]);

  const handleItemClick = (item: FormulaItem) => {
    // Just open the modal for editing without selecting the element
    // This allows the panel to stay visible and the modal to open properly
    setEditingItem(item);
  };

  const handleApplyFormula = (value: string | number | undefined) => {
    if (!editingItem) return;

    if (editingItem.type === 'node') {
      updateNodeProperty(editingItem.key, editingItem.propertyKey, value as string || '');
    } else {
      updateEdgeProperty(editingItem.key, editingItem.propertyKey, value as string || '');
    }
    
    setEditingItem(null);
  };

  const handleCancelFormula = () => {
    setEditingItem(null);
  };

  // Don't show panel if both node and edge are selected
  if (selectedNodeKey || selectedEdgeKey) {
    return null;
  }

  return (
    <section className={styles.formulaListPanel}>
      {/* Header */}
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className={styles.title}>Все формулы</h2>
        <span className={styles.badge}>{formulaItems.length}</span>
        <button
          className={styles.toggleButton}
          title={isExpanded ? 'Свернуть' : 'Развернуть'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          {formulaItems.length === 0 ? (
            <p className={styles.emptyMessage}>
              Нет элементов с формулами
            </p>
          ) : (
            <div className={styles.itemList}>
              {formulaItems.map((item) => (
                <button
                  key={`${item.type}-${item.key}-${item.propertyKey}`}
                  className={styles.item}
                  onClick={() => handleItemClick(item)}
                  title={`${item.name} - ${item.propertyLabel}`}
                >
                  <div className={styles.itemHeader}>
                    <span
                      className={styles.itemType}
                      style={{ backgroundColor: getTypeColor(item.category) }}
                    >
                      {item.category}
                    </span>
                    <span className={styles.itemName}>{item.name}</span>
                  </div>
                  <div className={styles.itemProperty}>
                    <span className={styles.propertyLabel}>{item.propertyLabel}:</span>
                    <span className={styles.propertyValue}>
                      {item.value || <em>не задано</em>}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {editingItem && (
        <FormulaEditorModal
          isOpen={true}
          label={`${editingItem.name} - ${editingItem.propertyLabel}`}
          value={editingItem.value}
          placeholder={`Введите ${editingItem.propertyLabel.toLowerCase()}...`}
          availableReferences={availableReferences}
          onApply={handleApplyFormula}
          onCancel={handleCancelFormula}
        />
      )}
    </section>
  );
}

