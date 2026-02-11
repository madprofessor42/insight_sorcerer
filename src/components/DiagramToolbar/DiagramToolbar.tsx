/**
 * Diagram toolbar - New/Load/Save/Save As controls displayed on the canvas
 */

import { useState, useCallback } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { clearDiagram, setSimulationConfig } from '../../store/diagramSlice';
import { DEFAULT_SIMULATION_CONFIG } from '../../types/simulation';
import { useDiagramPersistence } from '../../hooks/diagram/useDiagramPersistence';
import { saveLastOpenedDiagramId } from '../../utils/database';
import type { DiagramMetadata } from '../../utils/database';
import { useToast } from '../ui';
import { Modal, ModalActions, FormField } from '../ui';
import styles from './DiagramToolbar.module.css';

interface DiagramToolbarProps {
  currentDiagramId: string | null;
  currentDiagramName: string;
  onDiagramChanged: (id: string | null, name: string) => void;
}

export function DiagramToolbar({ 
  currentDiagramId, 
  currentDiagramName,
  onDiagramChanged 
}: DiagramToolbarProps) {
  const dispatch = useAppDispatch();
  const { saveDiagram, loadDiagram, getSavedDiagrams, deleteDiagram, status } = useDiagramPersistence();
  const toast = useToast();
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveMode, setSaveMode] = useState<'save' | 'saveAs'>('save');
  const [diagramName, setDiagramName] = useState('');
  const [savedDiagrams, setSavedDiagrams] = useState<DiagramMetadata[]>([]);

  // Load diagrams list for load dialog
  const loadSavedDiagrams = useCallback(async () => {
    try {
      const diagrams = await getSavedDiagrams();
      setSavedDiagrams(diagrams);
    } catch (err) {
      console.error('Failed to load saved diagrams:', err);
    }
  }, [getSavedDiagrams]);

  // Handle New button click
  const handleNew = useCallback(async () => {
    if (confirm('Создать новую диаграмму? Несохранённые изменения будут потеряны.')) {
      dispatch(clearDiagram());
      dispatch(setSimulationConfig(DEFAULT_SIMULATION_CONFIG));
      onDiagramChanged(null, '');
      await saveLastOpenedDiagramId(null);
      toast.showInfo('Создана новая диаграмма');
    }
  }, [dispatch, onDiagramChanged, toast]);

  // Handle Load button click
  const handleLoad = useCallback(() => {
    loadSavedDiagrams();
    setShowLoadDialog(true);
  }, [loadSavedDiagrams]);

  // Handle Save button click
  const handleSave = useCallback(() => {
    if (currentDiagramId && currentDiagramName) {
      // Has existing diagram - save directly
      saveDiagram(currentDiagramName, currentDiagramId)
        .then(() => {
          toast.showSuccess(`Диаграмма "${currentDiagramName}" сохранена`);
        })
        .catch((err) => {
          console.error('Failed to save diagram:', err);
          toast.showError('Не удалось сохранить диаграмму');
        });
    } else {
      // No existing diagram - show dialog
      setSaveMode('save');
      setDiagramName('');
      setShowSaveDialog(true);
    }
  }, [currentDiagramId, currentDiagramName, saveDiagram, toast]);

  // Handle Save As button click
  const handleSaveAs = useCallback(() => {
    setSaveMode('saveAs');
    setDiagramName('');
    setShowSaveDialog(true);
  }, []);

  // Handle save dialog apply
  const handleSaveApply = useCallback(async () => {
    if (!diagramName.trim()) {
      toast.showError('Введите название диаграммы');
      return;
    }

    try {
      const id = saveMode === 'saveAs' ? undefined : currentDiagramId || undefined;
      const savedId = await saveDiagram(diagramName.trim(), id);
      
      onDiagramChanged(savedId, diagramName.trim());
      setShowSaveDialog(false);
      toast.showSuccess(`Диаграмма "${diagramName}" сохранена`);
    } catch (err) {
      console.error('Failed to save diagram:', err);
      toast.showError('Не удалось сохранить диаграмму');
    }
  }, [diagramName, saveMode, currentDiagramId, saveDiagram, onDiagramChanged, toast]);

  // Handle load diagram from list
  const handleLoadDiagram = useCallback(async (id: string, name: string) => {
    try {
      await loadDiagram(id);
      onDiagramChanged(id, name);
      setShowLoadDialog(false);
      toast.showSuccess(`Диаграмма "${name}" загружена`);
    } catch (err) {
      console.error('Failed to load diagram:', err);
      toast.showError('Не удалось загрузить диаграмму');
    }
  }, [loadDiagram, onDiagramChanged, toast]);

  // Handle delete diagram
  const handleDelete = useCallback(async (id: string, name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm(`Удалить диаграмму "${name}"?`)) {
      return;
    }

    try {
      await deleteDiagram(id);
      if (id === currentDiagramId) {
        onDiagramChanged(null, '');
      }
      toast.showSuccess('Диаграмма удалена');
      await loadSavedDiagrams();
    } catch (err) {
      console.error('Failed to delete diagram:', err);
      toast.showError('Не удалось удалить диаграмму');
    }
  }, [deleteDiagram, currentDiagramId, onDiagramChanged, toast, loadSavedDiagrams]);

  const isSaving = status === 'saving';

  return (
    <>
      <div className={styles.toolbar}>
        <button
          onClick={handleNew}
          className={styles.button}
          title="Create new diagram"
        >
          New
        </button>
        
        <button
          onClick={handleLoad}
          className={styles.button}
          title="Load saved diagram"
        >
          Load
        </button>
        
        <div className={styles.divider} />
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={styles.button}
          title="Save diagram"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        
        <button
          onClick={handleSaveAs}
          disabled={isSaving}
          className={styles.button}
          title="Save as new diagram"
        >
          Save As
        </button>
      </div>

      {/* Save dialog */}
      <Modal
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title={saveMode === 'save' ? 'Save Diagram' : 'Save As New Diagram'}
        size="small"
      >
        <div className={styles.dialogContent}>
          <FormField
            id="diagram-name"
            label="Diagram Name"
            required
          >
            <input
              id="diagram-name"
              type="text"
              value={diagramName}
              onChange={(e) => setDiagramName(e.target.value)}
              placeholder="Enter diagram name"
              className={styles.input}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveApply();
                }
              }}
            />
          </FormField>
        </div>

        <ModalActions
          onCancel={() => setShowSaveDialog(false)}
          onConfirm={handleSaveApply}
          cancelLabel="Cancel"
          confirmLabel="Save"
          confirmDisabled={!diagramName.trim() || isSaving}
        />
      </Modal>

      {/* Load dialog */}
      <Modal
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        title="Load Diagram"
        size="medium"
      >
        <div className={styles.loadList}>
          {savedDiagrams.length === 0 ? (
            <div className={styles.emptyState}>
              No saved diagrams
            </div>
          ) : (
            savedDiagrams.map((diagram) => (
              <div
                key={diagram.id}
                className={`${styles.loadItem} ${diagram.id === currentDiagramId ? styles.loadItemActive : ''}`}
                onClick={() => handleLoadDiagram(diagram.id, diagram.name)}
              >
                <div className={styles.loadItemContent}>
                  <div className={styles.loadItemName}>{diagram.name}</div>
                  <div className={styles.loadItemMeta}>
                    {diagram.nodeCount} nodes · {diagram.linkCount} links
                  </div>
                  <div className={styles.loadItemDate}>
                    {new Date(diagram.updatedAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(diagram.id, diagram.name, e)}
                  className={styles.deleteButton}
                  title="Delete diagram"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}

