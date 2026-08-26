import React from 'react';
import { createPortal } from 'react-dom';
import { panel, groupLabel, divider, readout, range } from './mapUiTheme';
import type { CoverageStats } from '../gis/serviceAreaAnalysis';

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
  coverage: CoverageStats | null;
  onToggleActive: () => void;
  onRadiusChange: (radius: number) => void;
  onExportGeoJSON: () => void;
  onExportPdf: () => void;
}

export const BufferTool: React.FC<BufferToolProps> = ({
  active,
  radius,
  result,
  coverage,
  onToggleActive,
  onRadiusChange,
  onExportGeoJSON,
  onExportPdf,
}) => {
  return createPortal(
    <div className={`${panel} bottom-4 left-4 p-2 w-72`}>
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="gis-group-label !p-0">Service area analysis</span>
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

      <button
        type="button"
        onClick={onToggleActive}
        className={`gis-btn ${active ? 'gis-btn-active' : ''}`}
        style={{
          width: '100%',
          height: 'auto',
          padding: '0.5rem 0.625rem',
          justifyContent: 'flex-start',
          gap: '0.5rem',
          fontSize: '11px',
          fontWeight: 500,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: active ? 'var(--gis-accent)' : 'var(--gis-text-faint)' }}
        />
        {active ? 'Click the map to place a service point' : 'Start service area analysis'}
      </button>

      {active && (
        <>
          <div className={divider} />

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] px-1 text-[var(--gis-text-faint)]">
              <span className="uppercase tracking-[0.1em]">Service radius</span>
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

          <div className={groupLabel}>Coverage</div>

          {coverage ? (
            <div className="flex flex-col gap-1.5 px-1">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-[var(--gis-text-faint)] uppercase tracking-[0.08em]">Covered</span>
                <span className="text-lg font-semibold tabular-nums" style={{ color: 'var(--gis-accent)' }}>
                  {coverage.coveragePct.toFixed(0)}%
                </span>
              </div>

              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--gis-border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${coverage.coveragePct}%`, backgroundColor: 'var(--gis-accent)' }}
                />
              </div>

              <div className={readout}>
                {coverage.coveredPopulation.toLocaleString()} of {coverage.totalPopulation.toLocaleString()} simulated
                residents covered
                <br />
                {coverage.pointsCovered}/{coverage.pointsTotal} points ·{' '}
                <span style={{ color: coverage.gapPct > 40 ? '#c97a5a' : 'var(--gis-text-muted)' }}>
                  {coverage.gapPct.toFixed(0)}% service gap
                </span>
              </div>

              <p className="text-[9px] leading-snug px-0.5" style={{ color: 'var(--gis-text-faint)' }}>
                Resident points are randomly simulated for demonstration — not real demographic data.
              </p>
            </div>
          ) : (
            <div className={readout}>
              <span style={{ color: 'var(--gis-text-faint)' }}>Click the map to run the analysis.</span>
            </div>
          )}

          {result && (
            <div className="text-[10px] font-mono px-1" style={{ color: 'var(--gis-text-faint)' }}>
              {result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}
            </div>
          )}

          {result && (
            <>
              <div className={divider} />
              <div className="flex gap-1 px-1">
                <button
                  type="button"
                  onClick={onExportGeoJSON}
                  className="gis-btn gis-label-btn flex-1 justify-center"
                >
                  Download GeoJSON
                </button>
                <button type="button" onClick={onExportPdf} className="gis-btn gis-label-btn flex-1 justify-center">
                  Export PDF
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>,
    document.body,
  );
};