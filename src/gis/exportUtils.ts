// Client-side export: GeoJSON download (real buffer geometry + stats as
// feature properties) and a PDF summary via the browser's native
// print-to-PDF — no external PDF library needed.

import { SpatialProcessor } from './SpatialProcessor';
import type { CoverageStats } from './serviceAreaAnalysis';

export interface ExportableResult {
  longitude: number;
  latitude: number;
  radiusMeters: number;
  areaSqKm: number;
}

export function downloadBufferGeoJSON(result: ExportableResult, coverage: CoverageStats | null): void {
  const buffer = SpatialProcessor.calculateGeodesicBuffer(result.longitude, result.latitude, result.radiusMeters);
  const feature = buffer.geometry.features[0];
  if (!feature) return;

  const exportFeature = {
    ...feature,
    properties: {
      ...feature.properties,
      generatedAt: new Date().toISOString(),
      centerLongitude: result.longitude,
      centerLatitude: result.latitude,
      radiusMeters: result.radiusMeters,
      areaSqKm: Number(result.areaSqKm.toFixed(4)),
      ...(coverage
        ? {
            simulatedPopulationCovered: coverage.coveredPopulation,
            simulatedPopulationTotal: coverage.totalPopulation,
            coveragePct: Number(coverage.coveragePct.toFixed(1)),
            gapPct: Number(coverage.gapPct.toFixed(1)),
            note: 'Population figures are simulated for demonstration and are not real demographic data.',
          }
        : {}),
    },
  };

  const exportCollection = { type: 'FeatureCollection' as const, features: [exportFeature] };
  const blob = new Blob([JSON.stringify(exportCollection, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `service-area-${Date.now()}.geojson`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}