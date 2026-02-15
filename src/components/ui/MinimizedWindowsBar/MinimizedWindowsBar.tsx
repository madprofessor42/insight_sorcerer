import styles from './MinimizedWindowsBar.module.css';

export interface MinimizedWindow {
  id: string;
  title: string;
  icon?: string;
}

interface MinimizedWindowsBarProps {
  windows: MinimizedWindow[];
  onRestore: (windowId: string) => void;
  onClose: (windowId: string) => void;
}

export const MinimizedWindowsBar = ({ windows, onRestore, onClose }: MinimizedWindowsBarProps) => {
  if (windows.length === 0) return null;

  return (
    <div className={styles.bar}>
      {windows.map((window) => (
        <div key={window.id} className={styles.windowItem}>
          <button
            className={styles.windowButton}
            onClick={() => onRestore(window.id)}
            title={`Развернуть: ${window.title}`}
          >
            {window.icon && <span className={styles.icon}>{window.icon}</span>}
            <span className={styles.title}>{window.title}</span>
          </button>
          <button
            className={styles.closeButton}
            onClick={(e) => {
              e.stopPropagation();
              onClose(window.id);
            }}
            title="Закрыть"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

