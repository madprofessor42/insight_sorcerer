/**
 * Form Validation Utilities for Simulation Settings
 * 
 * Pure functions for converting between UI form state and simulation config.
 * Extracted from component for testability and reusability.
 */

import type { SimulationConfig } from './types';
import { DEFAULT_SIMULATION_CONFIG } from './constants';

/**
 * Time unit options for simulation
 */
export type TimeUnit = 'Seconds' | 'Minutes' | 'Hours' | 'Days' | 'Weeks' | 'Months' | 'Years';

/**
 * Algorithm options for simulation
 */
export type Algorithm = 'Euler' | 'RK4';

/**
 * Local form state for settings modal.
 * Uses strings for numbers to allow empty input during editing.
 */
export interface SettingsFormState {
  timeStart: string;
  timeLength: string;
  timeStep: string;
  timeUnits: TimeUnit;
  algorithm: Algorithm;
}

/**
 * Convert SimulationConfig to form state with defaults.
 * 
 * @param config - Simulation configuration
 * @returns Form state with string values for editing
 */
export function configToFormState(config: SimulationConfig): SettingsFormState {
  return {
    timeStart: String(config.timeStart ?? DEFAULT_SIMULATION_CONFIG.timeStart),
    timeLength: String(config.timeLength ?? DEFAULT_SIMULATION_CONFIG.timeLength),
    timeStep: String(config.timeStep ?? DEFAULT_SIMULATION_CONFIG.timeStep),
    timeUnits: config.timeUnits ?? DEFAULT_SIMULATION_CONFIG.timeUnits,
    algorithm: config.algorithm ?? DEFAULT_SIMULATION_CONFIG.algorithm,
  };
}

/**
 * Validate and convert form state to SimulationConfig.
 * 
 * Validation rules:
 * - All numeric fields must be valid numbers
 * - timeLength must be positive
 * - timeStep must be positive
 * 
 * @param form - Form state with string values
 * @returns Valid SimulationConfig or null if invalid
 */
export function formStateToConfig(form: SettingsFormState): SimulationConfig | null {
  const timeStart = parseFloat(form.timeStart);
  const timeLength = parseFloat(form.timeLength);
  const timeStep = parseFloat(form.timeStep);

  // Validate all fields are numbers
  if (isNaN(timeStart) || isNaN(timeLength) || isNaN(timeStep)) {
    return null;
  }

  // Validate positive values for length and step
  if (timeLength <= 0 || timeStep <= 0) {
    return null;
  }

  return {
    timeStart,
    timeLength,
    timeStep,
    timeUnits: form.timeUnits,
    algorithm: form.algorithm,
  };
}

/**
 * Validate simulation configuration.
 * 
 * @param config - Configuration to validate
 * @returns True if valid, false otherwise
 */
export function validateSimulationConfig(config: SimulationConfig): boolean {
  if (config.timeLength !== undefined && config.timeLength <= 0) {
    return false;
  }
  
  if (config.timeStep !== undefined && config.timeStep <= 0) {
    return false;
  }
  
  return true;
}

/**
 * Get validation error message for form state.
 * 
 * @param form - Form state to validate
 * @returns Error message or null if valid
 */
export function getFormValidationError(form: SettingsFormState): string | null {
  const timeStart = parseFloat(form.timeStart);
  const timeLength = parseFloat(form.timeLength);
  const timeStep = parseFloat(form.timeStep);

  if (isNaN(timeStart)) {
    return 'Start time must be a valid number';
  }

  if (isNaN(timeLength)) {
    return 'Time length must be a valid number';
  }

  if (isNaN(timeStep)) {
    return 'Time step must be a valid number';
  }

  if (timeLength <= 0) {
    return 'Time length must be greater than 0';
  }

  if (timeStep <= 0) {
    return 'Time step must be greater than 0';
  }

  return null;
}

