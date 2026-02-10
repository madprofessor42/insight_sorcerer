/**
 * DiagramStorage Component
 * 
 * UI for saving and loading diagrams to/from IndexedDB
 */

import { useState, useEffect } from 'react';
import { useDiagramPersistence } from '../../../hooks/diagram/useDiagramPersistence';
import { useToast } from '../../Toast';
import type { DiagramMetadata } from '../../../utils/database';
import styles from './DiagramStorage.module.css';

export function DiagramStorage() {
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

  // Load saved diagrams on mount
  useEffect(() => {
    loadSavedDiagrams();
  }, []);

  const loadSavedDiagrams = async () => {
    try {
      const diagrams = await getSavedDiagrams();
      setSavedDiagrams(diagrams);
    } catch (err) {
      console.error('Failed to load saved diagrams:', err);
    }
  };

  const handleSave = async () => {
    if (!diagramName.trim()) {
      return;
    }

    try {
      await saveDiagram(diagramName.trim());
      toast.showSuccess('Диаграмма успешно сохранена!');
      setDiagramName('');
      await loadSavedDiagrams();
    } catch (err) {
      console.error('Failed to save diagram:', err);
      toast.showError('Не удалось сохранить диаграмму');
    }
  };

  const handleLoad = async (id: string) => {
    try {
      await loadDiagram(id);
      toast.showSuccess('Диаграмма успешно загружена!');
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
      toast.showSuccess('Диаграмма удалена');
      await loadSavedDiagrams();
    } catch (err) {
      console.error('Failed to delete diagram:', err);
      toast.showError('Не удалось удалить диаграмму');
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

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && diagramName.trim()) {
      handleSave();
    }
  };

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>💾 Хранилище диаграмм</h3>
        <button
          className={styles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Свернуть' : 'Развернуть'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.content}>

          {/* Save section */}
          <div className={styles.saveSection}>
            <input
              type="text"
              className={styles.input}
              placeholder="Название диаграммы..."
              value={diagramName}
              onChange={(e) => setDiagramName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={status === 'saving'}
            />
            <button
              className={`${styles.button} ${styles.saveButton}`}
              onClick={handleSave}
              disabled={!diagramName.trim() || status === 'saving'}
            >
              {status === 'saving' ? 'Сохранение...' : 'Сохранить'}
            </button>
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
                    className={styles.diagramItem}
                    onClick={() => handleLoad(diagram.id)}
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
                        🗑️
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

