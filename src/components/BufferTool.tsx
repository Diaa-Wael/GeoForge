import React from 'react';
import { createPortal } from 'react-dom';
import { panel, groupLabel, divider, readout, range, getGisUiThemeStyle } from './mapUiTheme';
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
  activeBasemapId: string;
  measurementMode?: 'none' | 'distance' | 'area';
  measurementSummary?: string | null;
  onToggleActive: () => void;
  onRadiusChange: (radius: number) => void;
  onMeasurementModeChange?: (mode: 'none' | 'distance' | 'area') => void;
  onClearMeasurement?: () => void;
  onExportGeoJSON: () => void;
  onExportPdf: () => void;
}

export const BufferTool: React.FC<BufferToolProps> = ({
  active,
  radius,
  result,
  coverage,
  activeBasemapId,
  measurementMode = 'none',
  measurementSummary,
  onToggleActive,
  onRadiusChange,
  onMeasurementModeChange,
  onClearMeasurement,
  onExportGeoJSON,
  onExportPdf,
}) => {
  const [isOpen, setIsOpen] = React.useState(() => typeof window === 'undefined' || window.innerWidth > 640);
  const mapUiThemeStyle = getGisUiThemeStyle(activeBasemapId);

  const handleToggleActive = () => {
    setIsOpen(false);
    onToggleActive();
  };

  return createPortal(
    <div
      className={`${panel} gis-service-panel gis-mobile-service-panel ${isOpen ? '' : 'collapsed'} ${result ? 'has-result' : ''}`}
      style={{
        ...mapUiThemeStyle,
        width: isOpen ? 'min(15.5rem, calc(100vw - 1.5rem))' : 'min(12.5rem, calc(100vw - 1.5rem))',
      }}
    >
      <div className="gis-service-header">
        <div className="flex items-center gap-2 min-w-0">
          <span className="gis-service-icon">◎</span>
          <span className="gis-group-label !p-0 truncate">Service area analysis</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="gis-service-badge"
            style={{
              color: active ? 'var(--gis-accent)' : 'var(--gis-text-faint)',
              backgroundColor: active ? 'var(--gis-accent-soft)' : 'var(--gis-active-track)',
              borderColor: active ? 'var(--gis-accent-border)' : 'var(--gis-border)',
            }}
          >
            {active ? 'Active' : 'Idle'}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="gis-btn gis-icon-btn gis-collapse-btn"
            aria-label={isOpen ? 'Collapse service analysis' : 'Expand service analysis'}
            title={isOpen ? 'Collapse service analysis' : 'Expand service analysis'}
            style={{ width: '24px', height: '24px', fontSize: '12px' }}
          >
            {isOpen ? '−' : '+'}
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          <button
            type="button"
            onClick={handleToggleActive}
            className={`gis-btn gis-service-button ${active ? 'gis-btn-active' : ''}`}
          >
            <span
              className="gis-service-dot"
              style={{ backgroundColor: active ? 'var(--gis-accent)' : 'var(--gis-text-faint)' }}
            />
            <span className="gis-service-button-text">
              {active ? 'Click the map to place a service point' : 'Start service area analysis'}
            </span>
          </button>

          {active && (
            <>
              <div className={divider} />

              <div className="gis-radius-control flex flex-col gap-1">
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

                  <div className={`${readout} gis-coverage-detail`}>
                    {coverage.coveredPopulation.toLocaleString()} of {coverage.totalPopulation.toLocaleString()} simulated
                    residents covered
                    <br />
                    {coverage.pointsCovered}/{coverage.pointsTotal} points ·{' '}
                    <span style={{ color: coverage.gapPct > 40 ? '#c97a5a' : 'var(--gis-text-muted)' }}>
                      {coverage.gapPct.toFixed(0)}% service gap
                    </span>
                  </div>

                  <p className="gis-analysis-note text-[9px] leading-snug px-0.5" style={{ color: 'var(--gis-text-faint)' }}>
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

              <div className={divider} />
              <div className={groupLabel}>Geo tools</div>
              <div className="grid grid-cols-2 gap-1 px-1">
                <button
                  type="button"
                  onClick={() => onMeasurementModeChange?.(measurementMode === 'distance' ? 'none' : 'distance')}
                  className={`gis-btn gis-label-btn justify-center ${measurementMode === 'distance' ? 'gis-btn-active' : ''}`}
                >
                  Distance
                </button>
                <button
                  type="button"
                  onClick={() => onMeasurementModeChange?.(measurementMode === 'area' ? 'none' : 'area')}
                  className={`gis-btn gis-label-btn justify-center ${measurementMode === 'area' ? 'gis-btn-active' : ''}`}
                >
                  Area
                </button>
              </div>

              <div className="px-1 mt-1">
                <button
                  type="button"
                  onClick={onClearMeasurement}
                  className="gis-btn gis-label-btn justify-center w-full"
                >
                  Clear measurement
                </button>
              </div>

              {measurementSummary && (
                <div className={`${readout} mt-2`}>
                  {measurementSummary}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>,
    document.body,
  );
};