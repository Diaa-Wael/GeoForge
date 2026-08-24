// Class-name tokens for the floating map tool panels. Actual colors, hover,
// and focus states live in mapUi.css as real CSS — inline style objects
// can't respond to :hover, which is why this used to feel static.

export const panel = 'gis-panel';
export const groupLabel = 'gis-group-label';
export const divider = 'gis-divider';

export const iconBtn = (isActive: boolean) => `gis-btn gis-icon-btn${isActive ? ' gis-btn-active' : ''}`;
export const labelBtn = (isActive: boolean) => `gis-btn gis-label-btn${isActive ? ' gis-btn-active' : ''}`;

export const readout = 'gis-readout';
export const input = 'gis-input';
export const range = 'gis-range';
export const resultRow = 'gis-result-row';
export const searchTrigger = 'gis-search-trigger';