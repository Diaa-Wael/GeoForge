// Class-name tokens for the floating map tool panels. Actual colors, hover,
// and focus states live in mapUi.css as real CSS — inline style objects
// can't respond to :hover, which is why this used to feel static.

import type { CSSProperties } from 'react';

export const panel = 'gis-panel';
export const groupLabel = 'gis-group-label';
export const divider = 'gis-divider';

export const getGisUiThemeStyle = (basemapId: string): CSSProperties => {
  const isDarkTheme = ['dark', 'satellite', 'hybrid'].includes(basemapId);

  return isDarkTheme
    ? ({
        '--gis-panel-bg': 'rgba(15, 23, 32, 0.9)',
        '--gis-border': 'rgba(203, 213, 225, 0.34)',
        '--gis-text': '#f8fafc',
        '--gis-text-muted': '#e2e8f0',
        '--gis-text-faint': '#cbd5e1',
        '--gis-accent': '#67e8f9',
        '--gis-accent-soft': 'rgba(103, 232, 249, 0.18)',
        '--gis-accent-border': 'rgba(103, 232, 249, 0.68)',
        '--gis-hover-bg': 'rgba(255, 255, 255, 0.16)',
        '--gis-active-track': 'rgba(148, 163, 184, 0.18)',
        '--gis-btn-surface': 'rgba(255, 255, 255, 0.08)',
        '--gis-btn-surface-strong': 'rgba(255, 255, 255, 0.16)',
      } as CSSProperties)
    : ({
        '--gis-panel-bg': 'rgba(255, 255, 255, 0.9)',
        '--gis-border': '#dfe5ec',
        '--gis-text': '#1f2937',
        '--gis-text-muted': '#475569',
        '--gis-text-faint': '#64748b',
        '--gis-accent': '#0369a1',
        '--gis-accent-soft': 'rgba(3, 105, 161, 0.1)',
        '--gis-accent-border': 'rgba(3, 105, 161, 0.38)',
        '--gis-hover-bg': '#e0f2fe',
        '--gis-active-track': '#f8fafc',
        '--gis-btn-surface': 'rgba(15, 23, 42, 0.03)',
        '--gis-btn-surface-strong': 'rgba(15, 23, 42, 0.06)',
      } as CSSProperties);
};

export const iconBtn = (isActive: boolean) => `gis-btn gis-icon-btn${isActive ? ' gis-btn-active' : ''}`;
export const labelBtn = (isActive: boolean) => `gis-btn gis-label-btn${isActive ? ' gis-btn-active' : ''}`;

export const readout = 'gis-readout';
export const input = 'gis-input';
export const range = 'gis-range';
export const resultRow = 'gis-result-row';
export const searchTrigger = 'gis-search-trigger';