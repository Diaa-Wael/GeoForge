import React from 'react';
import { createPortal } from 'react-dom';
import { panel, groupLabel, divider, readout, range } from './mapUiTheme';

export interface BufferResult {
  longitude: number;
  latitude: number;
  radiusMeters: number;
  areaSqKm: number;
}

interface BufferToolProps {
  active: boolean;
  radius: number;
  result: BufferResult | null;
  onToggleActive: () => void;
  onRadiusChange: (radius: number) => void;
}

export const BufferTool: React.FC<BufferToolProps> = ({ active, radius, result, onToggleActive, onRadiusChange }) => {
  return createPortal(
    <div className={`${panel} bottom-4 left-4 p-2 w-64`}>
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="gis-group-label !p-0">Buffer analysis</span>
        <span
          className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
          style={{
            color: active ? 'var(--gis-accent)' : 'var(--gis-text-faint)',
            backgroundColor: active ? 'var(--gis-accent-soft)' : 'transparent',
          }}
        >
          {active ? 'Active' : 'Idle'}
        </span>
      </div>

      <button type="button" onClick={onToggleActive} className={`gis-btn ${active ? 'gis-btn-active' : ''}`} style={{ width: '100%', height: 'auto', padding: '0.5rem 0.625rem', justifyContent: 'flex-start', gap: '0.5rem', fontSize: '11px', fontWeight: 500 }}>
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: active ? 'var(--gis-accent)' : 'var(--gis-text-faint)' }}
        />
        {active ? 'Click the map to place a buffer' : 'Start buffer tool'}
      </button>

      {active && (
        <>
          <div className={divider} />

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] px-1 text-[var(--gis-text-faint)]">
              <span className="uppercase tracking-[0.1em]">Radius</span>
              <span className="font-mono tabular-nums text-[var(--gis-text)]">{radius} m</span>
            </div>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className={range}
            />
          </div>

          <div className={groupLabel}>Last reading</div>
          <div className={readout}>
            {result ? (
              <>
                {result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}
                <br />
                r&nbsp;{result.radiusMeters}m &nbsp;·&nbsp; area&nbsp;{result.areaSqKm.toFixed(3)}km²
              </>
            ) : (
              <span className="text-[var(--gis-text-faint)]">No point selected.</span>
            )}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
};