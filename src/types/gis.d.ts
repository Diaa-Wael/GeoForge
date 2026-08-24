import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';

/**
 * Expected properties for a Spatial Parcel Feature
 */
export interface SpatialParcelProperties {
  parcelId: string;
  zoningCode: string;
  acreage: number;
  ownerName?: string;
  assessedValue?: number;
  // Optional legacy fallbacks if supporting raw snake_case payload
  parcel_id?: string;
  zone?: string;
  land_use?: string;
}

/**
 * Parcel Feature & FeatureCollection Type Aliases
 */
export type ParcelFeature = Feature<Polygon | MultiPolygon, SpatialParcelProperties>;
export type ParcelFeatureCollection = FeatureCollection<Polygon | MultiPolygon, SpatialParcelProperties>;

/**
 * Buffer Analysis Output Interface
 */
export interface BufferAnalysisResult {
  geometry: FeatureCollection<Polygon | MultiPolygon>;
  areaSqMeters: number;
  bufferDistanceMeters: number;
}