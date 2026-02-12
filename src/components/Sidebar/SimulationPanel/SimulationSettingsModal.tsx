/**
 * Simulation Settings Modal - configuration dialog for simulation parameters.
 * 
 * Follows React controlled form pattern with object state.
 * Clean separation: Modal handles UI, parent handles state persistence.
 */

import { useState, useCallback, useEffect } from 'react';
import { Modal, FormField, ModalActions } from '../../ui';
import { 
  type SimulationConfig,
  type SettingsFormState,
  type TimeUnit,
  type Algorithm,
  TIME_UNITS,
  configToFormState,
  formStateToConfig
} from '../../../utils/simulation';
import styles from './SimulationSettingsModal.module.css';

export interface SimulationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: SimulationConfig;
  onApply: (config: SimulationConfig) => void;
}

export function SimulationSettingsModal({
  isOpen,
  onClose,
  initialConfig,
  onApply,
}: SimulationSettingsModalProps) {
  // Local form state - controlled inputs pattern
  // Initialize with current config
  const [form, setForm] = useState<SettingsFormState>(() => configToFormState(initialConfig));

  // Update form when modal opens or config changes
  useEffect(() => {
    if (isOpen) {
      setForm(configToFormState(initialConfig));
    }
  }, [isOpen, initialConfig]);

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Update form field - generic handler
  const updateField = useCallback(<K extends keyof SettingsFormState>(
    field: K,
    value: SettingsFormState[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(() => {
    const config = formStateToConfig(form);
    if (config) {
      onApply(config);
      handleClose();
    }
  }, [form, onApply, handleClose]);

  // Check if form is valid
  const isValid = formStateToConfig(form) !== null;

  // Helper functions for validation
  const isTimeStartValid = form.timeStart !== '' && !isNaN(parseFloat(form.timeStart));
  const isTimeLengthValid = form.timeLength !== '' && !isNaN(parseFloat(form.timeLength)) && parseFloat(form.timeLength) > 0;
  const isTimeStepValid = form.timeStep !== '' && !isNaN(parseFloat(form.timeStep)) && parseFloat(form.timeStep) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Simulation Time Settings"
      size="medium"
      closeOnBackdropClick={false}
    >
      <div className={styles.container}>
        {/* Basic Settings */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Simulation Settings</h3>
          
          <FormField 
            id="timeStart" 
            label="Simulation start"
            error={!isTimeStartValid ? 'Required' : undefined}
          >
            <input
              id="timeStart"
              type="number"
              value={form.timeStart}
              onChange={(e) => updateField('timeStart', e.target.value)}
              className={`${styles.input} ${!isTimeStartValid ? styles.inputError : ''}`}
            />
          </FormField>

          <FormField 
            id="timeLength" 
            label="Simulation length"
            error={!isTimeLengthValid ? 'Must be > 0' : undefined}
          >
            <input
              id="timeLength"
              type="number"
              value={form.timeLength}
              onChange={(e) => updateField('timeLength', e.target.value)}
              className={`${styles.input} ${!isTimeLengthValid ? styles.inputError : ''}`}
              min="0.01"
            />
          </FormField>

          <FormField id="timeUnits" label="Time Units">
            <div className={styles.radioGroup}>
              {TIME_UNITS.map((unit) => (
                <label key={unit} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="timeUnits"
                    value={unit}
                    checked={form.timeUnits === unit}
                    onChange={(e) => updateField('timeUnits', e.target.value as TimeUnit)}
                    className={styles.radio}
                  />
                  {unit}
                </label>
              ))}
            </div>
          </FormField>
        </section>

        {/* Advanced Settings */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Advanced Simulation Settings</h3>
          
          <FormField 
            id="timeStep" 
            label="Simulation time step"
            helpText="How long between simulation updates. Smaller values lead to more accurate but slower simulations."
            error={!isTimeStepValid ? 'Must be > 0' : undefined}
          >
            <input
              id="timeStep"
              type="number"
              value={form.timeStep}
              onChange={(e) => updateField('timeStep', e.target.value)}
              className={`${styles.input} ${!isTimeStepValid ? styles.inputError : ''}`}
              min="0.01"
              step="0.01"
            />
          </FormField>

          <FormField 
            id="algorithm" 
            label="Simulation algorithm"
            helpText="Euler is faster but generally less accurate."
          >
            <select
              id="algorithm"
              value={form.algorithm}
              onChange={(e) => updateField('algorithm', e.target.value as Algorithm)}
              className={styles.select}
            >
              <option value="RK4">4th Order Runge-Kutta</option>
              <option value="Euler">Euler</option>
            </select>
          </FormField>
        </section>

        {/* Action buttons */}
        <ModalActions
          cancelLabel="CANCEL"
          confirmLabel="APPLY"
          onCancel={handleClose}
          onConfirm={handleApply}
          confirmDisabled={!isValid}
          confirmVariant="primary"
        />
      </div>
    </Modal>
  );
}

