// Powers the "Resource Desert Analyzer": simulated resident points scattered
// around the current view, scored against whatever buffer polygon the user
// draws. Population figures are synthetic/random — this is a demonstration
// of the analysis technique, not real demographic data, and is labeled as
// such in the UI.

import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';

export interface ResidentProperties {
  population: number;
  covered: boolean;
}

export type ResidentsCollection = FeatureCollection<Point, ResidentProperties>;

export function generateMockResidents(
  center: [number, number],
  radiusKm: number,
  count: number,
): ResidentsCollection {
  const bbox = turf.bbox(turf.circle(center, radiusKm, { units: 'kilometers' })) as [
    number,
    number,
    number,
    number,
  ];

  const points = turf.randomPoint(count, { bbox });

  const features: Feature<Point, ResidentProperties>[] = points.features.map((feature) => ({
    ...feature,
    properties: {
      population: 15 + Math.floor(Math.random() * 135), // ~15-150 simulated residents per point
      covered: false,
    },
  }));

  return turf.featureCollection(features) as ResidentsCollection;
}

export interface CoverageStats {
  totalPopulation: number;
  coveredPopulation: number;
  coveragePct: number;
  gapPct: number;
  pointsCovered: number;
  pointsTotal: number;
}

/**
 * Marks each resident point's `covered` property based on whether it falls
 * inside the buffer polygon, and returns aggregate coverage stats.
 * Mutates/returns a new collection — does not mutate the input in place.
 */
export function scoreCoverage(
  residents: ResidentsCollection,
  bufferPolygon: Feature<Polygon>,
): { scored: ResidentsCollection; stats: CoverageStats } {
  const scoredFeatures = residents.features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      covered: turf.booleanPointInPolygon(feature, bufferPolygon),
    },
  }));

  const scored: ResidentsCollection = turf.featureCollection(scoredFeatures) as ResidentsCollection;

  const totalPopulation = scored.features.reduce((sum, f) => sum + f.properties.population, 0);
  const coveredFeatures = scored.features.filter((f) => f.properties.covered);
  const coveredPopulation = coveredFeatures.reduce((sum, f) => sum + f.properties.population, 0);
  const coveragePct = totalPopulation > 0 ? (coveredPopulation / totalPopulation) * 100 : 0;

  return {
    scored,
    stats: {
      totalPopulation,
      coveredPopulation,
      coveragePct,
      gapPct: 100 - coveragePct,
      pointsCovered: coveredFeatures.length,
      pointsTotal: scored.features.length,
    },
  };
}