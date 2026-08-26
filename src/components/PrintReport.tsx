import React from 'react';
import { createPortal } from 'react-dom';
import type { BufferResult } from './BufferTool';
import type { CoverageStats } from '../gis/serviceAreaAnalysis';

interface PrintReportProps {
  result: BufferResult | null;
  coverage: CoverageStats | null;
  snapshotDataUrl: string | null;
  basemapLabel: string;
}

const cellLabel: React.CSSProperties = { padding: '6px 12px 6px 0', color: '#666', borderBottom: '1px solid #eee' };
const cellValue: React.CSSProperties = {
  padding: '6px 0',
  fontWeight: 600,
  borderBottom: '1px solid #eee',
  textAlign: 'right',
};

export const PrintReport: React.FC<PrintReportProps> = ({ result, coverage, snapshotDataUrl, basemapLabel }) => {
  if (!result) return null;

  return createPortal(
    <div id="print-report-root" style={{ padding: '32px', fontFamily: 'system-ui, sans-serif', color: '#111' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Service Area Analysis Report</h1>
      <p style={{ fontSize: '11px', color: '#555', marginBottom: '20px' }}>
        Generated {new Date().toLocaleString()} · Basemap: {basemapLabel}
      </p>

      {snapshotDataUrl && (
        <img
          src={snapshotDataUrl}
          alt="Map view at time of export"
          style={{ width: '100%', borderRadius: '4px', marginBottom: '20px', border: '1px solid #ddd' }}
        />
      )}

      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={cellLabel}>Center coordinates</td>
            <td style={cellValue}>
              {result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}
            </td>
          </tr>
          <tr>
            <td style={cellLabel}>Service radius</td>
            <td style={cellValue}>{result.radiusMeters} m</td>
          </tr>
          <tr>
            <td style={cellLabel}>Coverage area</td>
            <td style={cellValue}>{result.areaSqKm.toFixed(3)} km²</td>
          </tr>
          {coverage && (
            <>
              <tr>
                <td style={cellLabel}>Simulated residents covered</td>
                <td style={cellValue}>
                  {coverage.coveredPopulation.toLocaleString()} of {coverage.totalPopulation.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td style={cellLabel}>Coverage</td>
                <td style={cellValue}>{coverage.coveragePct.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={cellLabel}>Service gap</td>
                <td style={cellValue}>{coverage.gapPct.toFixed(1)}%</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      <p style={{ fontSize: '10px', color: '#888', lineHeight: 1.5 }}>
        Resident/population figures are randomly simulated for demonstration purposes and do not represent real
        demographic data.
      </p>
    </div>,
    document.body,
  );
};