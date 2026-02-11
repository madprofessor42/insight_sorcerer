/**
 * useClickOutside - Hook for detecting clicks outside of elements
 * 
 * Used for closing dropdowns, modals, etc. when clicking outside.
 */

import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Hook that triggers a callback when clicking outside of provided elements.
 * 
 * @param refs - Array of refs to elements that should not trigger the callback
 * @param callback - Function to call when clicking outside
 * @param enabled - Whether the hook is enabled (default: true)
 * 
 * @example
 * ```tsx
 * const inputRef = useRef<HTMLInputElement>(null);
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * 
 * useClickOutside(
 *   [inputRef, dropdownRef],
 *   () => setIsOpen(false),
 *   isOpen
 * );
 * ```
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  callback: () => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside all provided refs
      const clickedOutside = refs.every((ref) => {
        return ref.current && !ref.current.contains(event.target as Node);
      });

      if (clickedOutside) {
        callback();
      }
    };

    // Attach listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [refs, callback, enabled]);
}

