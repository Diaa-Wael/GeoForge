import * as turf from '@turf/turf';
import type { FeatureCollection, Polygon } from 'geojson';
import type { BufferAnalysisResult } from '../types/gis';

export class SpatialProcessor {
  public static calculateGeodesicBuffer(
    lng: number, 
    lat: number, 
    radiusMeters: number
  ): BufferAnalysisResult {
    const point = turf.point([lng, lat]);
    const bufferedPolygon = turf.buffer(point, radiusMeters, { units: 'meters' });
    const featureColl = turf.featureCollection(bufferedPolygon ? [bufferedPolygon] : []);
    
    const areaSqMeters = bufferedPolygon ? turf.area(bufferedPolygon) : 0;

    return {
      geometry: featureColl as unknown as FeatureCollection<Polygon>,
      centerCoordinates: [lng, lat],
      bufferDistanceMeters: radiusMeters,
      areaSqMeters
    } as BufferAnalysisResult;
  }
}