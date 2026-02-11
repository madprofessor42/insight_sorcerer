/**
 * DiagramStorage Component
 * 
 * UI for saving and loading diagrams to/from IndexedDB
 */

import { useState, useEffect, useRef } from 'react';
import { useDiagramPersistence } from '../../../hooks/diagram/useDiagramPersistence';
import { loadAutoSavedDiagram, clearAutoSavedDiagram, finishRestoration } from '../../../hooks/diagram/useDiagramAutoSave';
import { useToast } from '../../ui';
import { useAppDispatch } from '../../../store/hooks';
import { clearDiagram, loadDiagram as loadDiagramAction, setSimulationConfig } from '../../../store/diagramSlice';
import { DEFAULT_SIMULATION_CONFIG } from '../../../types/simulation';
import type { DiagramMetadata } from '../../../utils/database';
import styles from './DiagramStorage.module.css';

export function DiagramStorage() {
  const dispatch = useAppDispatch();
  const {
    saveDiagram,
    loadDiagram,
    getSavedDiagrams,
    deleteDiagram,
    status,
  } = useDiagramPersistence();

  const toast = useToast();

  const [diagramName, setDiagramName] = useState('');
  const [savedDiagrams, setSavedDiagrams] = useState<DiagramMetadata[]>([]);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(() => {
    // Restore current diagram ID from localStorage
    return localStorage.getItem('currentDiagramId') || null;
  });
  const [currentDiagramName, setCurrentDiagramName] = useState<string>(() => {
    // Restore current diagram name from localStorage
    return localStorage.getItem('currentDiagramName') || '';
  });
  
  // Use ref to prevent double restoration (survives StrictMode remounts)
  const hasRestoredRef = useRef(false);

  // Load saved diagrams on mount and restore auto-saved state
  useEffect(() => {
    // Prevent double restoration - critical for StrictMode
    if (hasRestoredRef.current) {
      return;
    }
    hasRestoredRef.current = true;

    const initializeDiagrams = async () => {
      await loadSavedDiagrams();
      
      // Restore auto-saved diagram state on first load only
      const autoSavedModel = loadAutoSavedDiagram();
      
      console.log('📦 Auto-saved model exists:', !!autoSavedModel);
      
      if (autoSavedModel) {
        try {
          const modelObj = JSON.parse(autoSavedModel);
          dispatch(
            loadDiagramAction({
              nodeDataArray: modelObj.nodeDataArray || [],
              linkDataArray: modelObj.linkDataArray || [],
              modelData: modelObj.modelData || {},
            })
          );
          console.log('✅ Restored auto-saved diagram from localStorage');
          
          // Note: simulation config is already loaded in store initialization
          
          // Mark restoration as complete after React updates
          finishRestoration();
        } catch (err) {
          console.error('Failed to restore auto-saved diagram:', err);
          clearAutoSavedDiagram();
          finishRestoration();
        }
      } else {
        // No saved diagram, simulation config already loaded in store
        finishRestoration();
      }
    };

    initializeDiagrams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - только один раз при монтировании

  const loadSavedDiagrams = async () => {
    try {
      const diagrams = await getSavedDiagrams();
      setSavedDiagrams(diagrams);
    } catch (err) {
      console.error('Failed to load saved diagrams:', err);
    }
  };

  // Helper to update current diagram ID with localStorage sync
  const updateCurrentDiagramId = (id: string | null) => {
    setCurrentDiagramId(id);
    if (id) {
      localStorage.setItem('currentDiagramId', id);
    } else {
      localStorage.removeItem('currentDiagramId');
    }
  };

  // Helper to update current diagram name with localStorage sync
  const updateCurrentDiagramName = (name: string) => {
    setCurrentDiagramName(name);
    if (name) {
      localStorage.setItem('currentDiagramName', name);
    } else {
      localStorage.removeItem('currentDiagramName');
    }
  };

  // Сохранить текущую диаграмму (перезапись в IndexedDB)
  const handleSave = async () => {
    if (!currentDiagramId || !currentDiagramName) {
      return;
    }

    try {
      await saveDiagram(currentDiagramName, currentDiagramId);
      toast.showSuccess(`Диаграмма "${currentDiagramName}" сохранена!`);
      await loadSavedDiagrams();
    } catch (err) {
      console.error('Failed to save diagram:', err);
      toast.showError('Не удалось сохранить диаграмму');
    }
  };

  // Сохранить как новую диаграмму в IndexedDB
  const handleSaveAs = async () => {
    if (!diagramName.trim()) {
      return;
    }

    try {
      const newId = await saveDiagram(diagramName.trim());
      updateCurrentDiagramId(newId);
      updateCurrentDiagramName(diagramName.trim());
      toast.showSuccess(`Диаграмма "${diagramName.trim()}" создана!`);
      setDiagramName('');
      await loadSavedDiagrams();
    } catch (err) {
      console.error('Failed to save diagram:', err);
      toast.showError('Не удалось сохранить диаграмму');
    }
  };

  const handleLoad = async (id: string, name: string) => {
    try {
      await loadDiagram(id);
      updateCurrentDiagramId(id);
      updateCurrentDiagramName(name);
      toast.showSuccess(`Диаграмма "${name}" загружена!`);
    } catch (err) {
      console.error('Failed to load diagram:', err);
      toast.showError('Не удалось загрузить диаграмму');
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Вы уверены, что хотите удалить эту диаграмму?')) {
      return;
    }

    try {
      await deleteDiagram(id);
      // Если удаляем текущую диаграмму, сбрасываем состояние
      if (id === currentDiagramId) {
        updateCurrentDiagramId(null);
        updateCurrentDiagramName('');
      }
      toast.showSuccess('Диаграмма удалена');
      await loadSavedDiagrams();
    } catch (err) {
      console.error('Failed to delete diagram:', err);
      toast.showError('Не удалось удалить диаграмму');
    }
  };

  // Создать новую диаграмму (очистить canvas)
  const handleNew = () => {
    if (confirm('Создать новую диаграмму? Текущее состояние будет очищено.')) {
      dispatch(clearDiagram());
      dispatch(setSimulationConfig(DEFAULT_SIMULATION_CONFIG)); // Reset simulation config to default
      updateCurrentDiagramId(null);
      updateCurrentDiagramName('');
      clearAutoSavedDiagram();
      toast.showInfo('Создана новая диаграмма');
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className={styles.title}>Хранилище диаграмм</h3>
        <button
          className={styles.toggleButton}
          title={isExpanded ? 'Свернуть' : 'Развернуть'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          {/* New diagram button */}
          <button
            className={`${styles.button} ${styles.newButton}`}
            onClick={handleNew}
            disabled={status === 'saving'}
            title="Создать новую диаграмму"
          >
            + Новая диаграмма
          </button>

          <div className={styles.divider} />

          {/* Current diagram info */}
          {currentDiagramId && (
            <div className={styles.currentDiagram}>
              <div className={styles.currentDiagramLabel}>Текущая диаграмма:</div>
              <div className={styles.currentDiagramName}>{currentDiagramName}</div>
            </div>
          )}

          {/* Save section */}
          <div className={styles.saveSection}>
            {currentDiagramId ? (
              <>
                <button
                  className={`${styles.button} ${styles.saveButton}`}
                  onClick={handleSave}
                  disabled={status === 'saving'}
                  title="Перезаписать текущую диаграмму"
                >
                  {status === 'saving' ? 'Сохранение...' : 'Сохранить'}
                </button>
                
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Новое название..."
                  value={diagramName}
                  onChange={(e) => setDiagramName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && diagramName.trim()) {
                      handleSaveAs();
                    }
                  }}
                  disabled={status === 'saving'}
                />
                
                <button
                  className={`${styles.button} ${styles.saveAsButton}`}
                  onClick={handleSaveAs}
                  disabled={!diagramName.trim() || status === 'saving'}
                  title="Сохранить как новую диаграмму"
                >
                  Сохранить как
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Название диаграммы..."
                  value={diagramName}
                  onChange={(e) => setDiagramName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && diagramName.trim()) {
                      handleSaveAs();
                    }
                  }}
                  disabled={status === 'saving'}
                />
                
                <button
                  className={`${styles.button} ${styles.saveButton}`}
                  onClick={handleSaveAs}
                  disabled={!diagramName.trim() || status === 'saving'}
                  title="Сохранить диаграмму"
                >
                  {status === 'saving' ? 'Сохранение...' : 'Сохранить'}
                </button>
              </>
            )}
          </div>

          <div className={styles.divider} />

          {/* Saved diagrams list */}
          <div>
            <h4 className={styles.listHeader}>
              Сохранённые диаграммы
            </h4>
            
            {status === 'loading' && (
              <div className={styles.loading}>Загрузка...</div>
            )}

            {status !== 'loading' && savedDiagrams.length === 0 && (
              <div className={styles.emptyState}>
                Нет сохранённых диаграмм
              </div>
            )}

            {status !== 'loading' && savedDiagrams.length > 0 && (
              <div className={styles.diagramList}>
                {savedDiagrams.map((diagram) => (
                  <div
                    key={diagram.id}
                    className={`${styles.diagramItem} ${diagram.id === currentDiagramId ? styles.diagramItemActive : ''}`}
                    onClick={() => handleLoad(diagram.id, diagram.name)}
                    title="Нажмите, чтобы загрузить"
                  >
                    <div className={styles.diagramInfo}>
                      <div className={styles.diagramName}>{diagram.name}</div>
                      <div className={styles.diagramMeta}>
                        {formatDate(diagram.updatedAt)} • {diagram.nodeCount} узлов • {diagram.linkCount} связей
                      </div>
                    </div>
                    <div className={styles.diagramActions}>
                      <button
                        className={`${styles.iconButton} ${styles.deleteButton}`}
                        onClick={(e) => handleDelete(diagram.id, e)}
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

