import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson';

export type MeasurementMode = 'none' | 'distance' | 'area';

export interface DistanceMeasurementResult {
  kind: 'distance';
  start: [number, number];
  end: [number, number];
  meters: number;
  kilometers: number;
  bearing: number;
  geometry: FeatureCollection;
}

export interface AreaMeasurementResult {
  kind: 'area';
  points: [number, number][];
  squareMeters: number;
  squareKilometers: number;
  perimeterMeters: number;
  perimeterKilometers: number;
  geometry: FeatureCollection;
}

export function measureDistanceBetweenPoints(
  start: [number, number],
  end: [number, number],
): DistanceMeasurementResult {
  const line = turf.lineString([start, end]);
  const meters = turf.length(line, { units: 'meters' });
  const kilometers = meters / 1000;
  const initialBearing = turf.bearing(turf.point(start), turf.point(end));

  return {
    kind: 'distance',
    start,
    end,
    meters,
    kilometers,
    bearing: (initialBearing + 360) % 360,
    geometry: {
      type: 'FeatureCollection',
      features: [
        line as any,
        turf.point(start) as any,
        turf.point(end) as any,
      ],
    } as FeatureCollection,
  };
}

export function measureAreaFromPoints(points: [number, number][]): AreaMeasurementResult | null {
  if (points.length < 3) return null;

  const closedRing = [...points, points[0]];
  const polygon = turf.polygon([closedRing]);
  const squareMeters = turf.area(polygon);
  const squareKilometers = squareMeters / 1_000_000;
  const perimeterMeters = turf.length(turf.lineString(closedRing), { units: 'meters' });
  const perimeterKilometers = perimeterMeters / 1000;

  return {
    kind: 'area',
    points,
    squareMeters,
    squareKilometers,
    perimeterMeters,
    perimeterKilometers,
    geometry: {
      type: 'FeatureCollection',
      features: [
        polygon as any,
        ...points.map((point) => turf.point(point) as any),
      ],
    } as FeatureCollection,
  };
}
