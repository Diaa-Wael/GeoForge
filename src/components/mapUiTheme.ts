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
        '--gis-panel-bg': 'rgba(15, 23, 32, 0.86)',
        '--gis-border': 'rgba(148, 163, 184, 0.24)',
        '--gis-text': '#f8fafc',
        '--gis-text-muted': '#e2e8f0',
        '--gis-text-faint': '#cbd5e1',
        '--gis-accent': '#7dd3fc',
        '--gis-accent-soft': 'rgba(125, 211, 252, 0.18)',
        '--gis-accent-border': 'rgba(125, 211, 252, 0.7)',
        '--gis-hover-bg': 'rgba(148, 163, 184, 0.14)',
        '--gis-active-track': 'rgba(96, 165, 250, 0.16)',
        '--gis-btn-surface': 'rgba(255, 255, 255, 0.06)',
        '--gis-btn-surface-strong': 'rgba(255, 255, 255, 0.12)',
      } as CSSProperties)
    : ({
        '--gis-panel-bg': 'rgba(255, 255, 255, 0.94)',
        '--gis-border': '#dfeaf4',
        '--gis-text': '#112033',
        '--gis-text-muted': '#334155',
        '--gis-text-faint': '#64748b',
        '--gis-accent': '#2563eb',
        '--gis-accent-soft': 'rgba(37, 99, 235, 0.10)',
        '--gis-accent-border': 'rgba(37, 99, 235, 0.34)',
        '--gis-hover-bg': '#edf6ff',
        '--gis-active-track': '#f8fbff',
        '--gis-btn-surface': 'rgba(15, 23, 42, 0.03)',
        '--gis-btn-surface-strong': 'rgba(37, 99, 235, 0.08)',
      } as CSSProperties);
};

export const iconBtn = (isActive: boolean) => `gis-btn gis-icon-btn${isActive ? ' gis-btn-active' : ''}`;
export const labelBtn = (isActive: boolean) => `gis-btn gis-label-btn${isActive ? ' gis-btn-active' : ''}`;

export const readout = 'gis-readout';
export const input = 'gis-input';
export const range = 'gis-range';
export const resultRow = 'gis-result-row';
export const searchTrigger = 'gis-search-trigger';