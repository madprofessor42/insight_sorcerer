/**
 * Reusable SVG icon components.
 * All icons use currentColor for stroke, making them themeable.
 */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const defaultProps: IconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
};

/** Settings/gear icon */
export function SettingsIcon(props: IconProps) {
  return (
    <svg {...defaultProps} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
    </svg>
  );
}

/** Bug icon for simulation */
export function BugIcon(props: IconProps) {
  return (
    <svg {...defaultProps} {...props}>
      <path d="M8 2v4M16 2v4" />
      <path d="M9 9h.01M15 9h.01" />
      <path d="M9 15c.5.5 1.5 1 3 1s2.5-.5 3-1" />
      <path d="M8 6h8a4 4 0 014 4v4a4 4 0 01-4 4H8a4 4 0 01-4-4v-4a4 4 0 014-4z" />
      <path d="M3 13h2M19 13h2M3 10h2M19 10h2" />
    </svg>
  );
}

/** Chart/Graph icon for result charts configuration */
export function ChartIcon(props: IconProps) {
  return (
    <svg {...defaultProps} {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

