import * as go from 'gojs';
import type { LinkType } from '../store/diagramSlice';
import { isSameLinkType } from '../config/diagram-rules';

/**
 * Check if a duplicate link of the same type already exists between two nodes
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - Source node key
 * @param toKey - Target node key
 * @param linkType - Type of the link to check
 * @param excludeLinkKey - Optional link key to exclude from check (for relinking)
 * @returns true if duplicate exists, false otherwise
 */
export function hasDuplicateLink(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: string | undefined,
  excludeLinkKey?: go.Key
): boolean {
  return model.linkDataArray.some(
    (ld: go.ObjectData) => 
      ld.from === fromKey && 
      ld.to === toKey && 
      isSameLinkType(ld.category, linkType) &&
      (excludeLinkKey === undefined || ld.key !== excludeLinkKey)
  );
}

/**
 * Find a reverse link of the same type between two nodes
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - Source node key
 * @param toKey - Target node key
 * @param linkType - Type of the link to check
 * @param excludeLinkKey - Optional link key to exclude from search
 * @returns The reverse link data if found, undefined otherwise
 */
export function findReverseLink(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: string | undefined,
  excludeLinkKey?: go.Key
): go.ObjectData | undefined {
  return model.linkDataArray.find(
    (ld: go.ObjectData) => 
      ld.from === toKey && 
      ld.to === fromKey && 
      isSameLinkType(ld.category, linkType) &&
      (excludeLinkKey === undefined || ld.key !== excludeLinkKey)
  );
}

/**
 * Check if a link can be created between two nodes
 * Validates both node types and checks for duplicates
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - Source node key
 * @param toKey - Target node key
 * @param linkType - Type of the link to create
 * @returns true if link can be created, false otherwise
 */
export function canCreateLink(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: LinkType
): boolean {
  // Check for duplicate links
  if (hasDuplicateLink(model, fromKey, toKey, linkType)) {
    return false;
  }
  
  return true;
}

/**
 * Check if a link can be relinked to new nodes
 * Validates both node types and checks for duplicates (excluding the link being relinked)
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - New source node key
 * @param toKey - New target node key
 * @param linkType - Type of the link
 * @param linkKey - Key of the link being relinked
 * @returns true if link can be relinked, false otherwise
 */
export function canRelinkToNodes(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: LinkType,
  linkKey: go.Key
): boolean {
  // Check for duplicate links (excluding current link)
  if (hasDuplicateLink(model, fromKey, toKey, linkType, linkKey)) {
    return false;
  }
  
  return true;
}

/**
 * Check if a link can be reversed without creating a duplicate
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - Current source node key
 * @param toKey - Current target node key
 * @param linkType - Type of the link
 * @param linkKey - Key of the link to reverse
 * @returns true if link can be reversed, false if reverse would create duplicate
 */
export function canReverseLink(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: string | undefined,
  linkKey: go.Key
): boolean {
  // Check if reversing (toKey -> fromKey) would create a duplicate
  // by checking if a link already exists from toKey to fromKey (excluding current link)
  return !hasDuplicateLink(model, toKey, fromKey, linkType, linkKey);
}

