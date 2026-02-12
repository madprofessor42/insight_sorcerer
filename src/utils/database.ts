/**
 * IndexedDB utilities for diagram persistence
 * 
 * Provides functions to save and load diagram data (nodes, links, model)
 * to/from the browser's IndexedDB storage.
 */

import * as go from 'gojs';
import { nanoid } from 'nanoid';
import type { SimulationConfig } from './simulation';

/**
 * IndexedDB-based storage for diagrams
 * 
 * This module provides persistent storage for diagrams using IndexedDB.
 * It includes:
 * - Manual save/load of named diagrams
 * - Auto-save functionality using a special __autosave__ slot
 * - Metadata queries for listing saved diagrams
 */

const DB_NAME = 'InsightSorcererDB';
const DB_VERSION = 1;
const STORE_NAME = 'diagrams';
const METADATA_STORE = 'metadata'; // Store for app metadata like last opened diagram

/**
 * Diagram data structure for storage
 */
export interface DiagramData {
  id: string;
  name: string;
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  simulationConfig: SimulationConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Metadata for a saved diagram (without full data)
 */
export interface DiagramMetadata {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  nodeCount: number;
  linkCount: number;
}

/**
 * Open the IndexedDB database
 * Creates the database and object store if they don't exist
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create diagrams object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Create indexes
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Create metadata object store for app settings
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Save a diagram to IndexedDB
 * 
 * @param id - Unique identifier for the diagram
 * @param name - Display name for the diagram
 * @param nodeDataArray - Array of node data
 * @param linkDataArray - Array of link data
 * @param modelData - Model metadata
 * @param simulationConfig - Simulation configuration
 * @returns Promise that resolves when save is complete
 */
export async function saveDiagram(
  id: string,
  name: string,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>,
  modelData: go.ObjectData,
  simulationConfig: SimulationConfig
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Check if diagram exists to preserve createdAt
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existingDiagram = getRequest.result as DiagramData | undefined;
      
      const diagramData: DiagramData = {
        id,
        name,
        nodeDataArray,
        linkDataArray,
        modelData,
        simulationConfig,
        createdAt: existingDiagram?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      const putRequest = store.put(diagramData);

      putRequest.onsuccess = () => {
        resolve();
      };

      putRequest.onerror = () => {
        reject(new Error('Failed to save diagram'));
      };
    };

    getRequest.onerror = () => {
      reject(new Error('Failed to check existing diagram'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Load a diagram from IndexedDB
 * 
 * @param id - Unique identifier of the diagram to load
 * @returns Promise that resolves with the diagram data
 */
export async function loadDiagram(id: string): Promise<DiagramData> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result as DiagramData);
      } else {
        reject(new Error(`Diagram with id "${id}" not found`));
      }
    };

    request.onerror = () => {
      reject(new Error('Failed to load diagram'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get all saved diagram metadata (without full data)
 * Useful for displaying a list of saved diagrams
 * 
 * @returns Promise that resolves with array of diagram metadata
 */
export async function getAllDiagramMetadata(): Promise<DiagramMetadata[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const diagrams = request.result as DiagramData[];
      
      // Map to metadata
      const metadata = diagrams.map(diagram => ({
        id: diagram.id,
        name: diagram.name,
        createdAt: diagram.createdAt,
        updatedAt: diagram.updatedAt,
        nodeCount: diagram.nodeDataArray.length,
        linkCount: diagram.linkDataArray.length,
      }));
      
      // Sort by most recently updated
      metadata.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      resolve(metadata);
    };

    request.onerror = () => {
      reject(new Error('Failed to load diagram list'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete a diagram from IndexedDB
 * 
 * @param id - Unique identifier of the diagram to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteDiagram(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete diagram'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Generate a unique ID for a new diagram
 * Uses nanoid for generating unique, URL-safe IDs
 */
export function generateDiagramId(): string {
  return `diagram_${nanoid()}`;
}

/**
 * Check if IndexedDB is available in the browser
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Save the ID of the last opened diagram
 */
export async function saveLastOpenedDiagramId(id: string | null): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(METADATA_STORE);
    const request = store.put({ key: 'lastOpenedDiagramId', value: id });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to save last opened diagram ID'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get the ID of the last opened diagram
 */
export async function getLastOpenedDiagramId(): Promise<string | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([METADATA_STORE], 'readonly');
    const store = transaction.objectStore(METADATA_STORE);
    const request = store.get('lastOpenedDiagramId');

    request.onsuccess = () => {
      const result = request.result;
      resolve(result?.value || null);
    };

    request.onerror = () => {
      reject(new Error('Failed to get last opened diagram ID'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

