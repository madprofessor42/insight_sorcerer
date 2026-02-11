/**
 * Toast notification component
 * Displays temporary notification messages
 */

import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export function Toast({ id, message, type, duration = 3000, onClose }: ToastProps) {
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id]);

  const handleClose = () => {
    setIsHiding(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  return (
    <div className={`${styles.toast} ${styles[type]} ${isHiding ? styles.hiding : ''}`}>
      <span className={styles.toastIcon}>{ICONS[type]}</span>
      <div className={styles.toastContent}>
        <p className={styles.toastMessage}>{message}</p>
      </div>
      <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
        ✕
      </button>
    </div>
  );
}

