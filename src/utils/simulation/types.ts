/**
 * Types for simulation integration in insight_sorcerer.
 * 
 * Adapted from system_dynamics to work with GoJS data structures.
 */

/**
 * Configuration for simulation run
 */
export interface SimulationConfig {
  timeStart?: number;
  timeLength?: number;
  timeStep?: number;
  timeUnits?: 'Seconds' | 'Minutes' | 'Hours' | 'Days' | 'Weeks' | 'Months' | 'Years';
  algorithm?: 'Euler' | 'RK4';
}

/**
 * Result of simulation run
 */
export interface SimulationRunResult {
  success: boolean;
  times?: number[];
  series?: Record<string, number[]>; // unique key (nanoid) → values
  error?: string;
  errorPrimitiveId?: string;
  errorPrimitiveName?: string;
}

