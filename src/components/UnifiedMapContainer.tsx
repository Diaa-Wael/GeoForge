import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { MapEngine } from '../gis/MapEngine';
import { SpatialProcessor } from '../gis/SpatialProcessor';
import { resolveInitialLocation } from '../gis/locationResolver';
import { readMapStateFromUrl, writeMapStateToUrl } from '../gis/urlState';
import { generateMockResidents, scoreCoverage, CoverageStats, ResidentsCollection } from '../gis/serviceAreaAnalysis';
import { downloadBufferGeoJSON } from '../gis/exportUtils';
import {
  measureAreaFromPoints,
  measureDistanceBetweenPoints,
  type MeasurementMode,
} from '../gis/measurementTools';
import type { ParcelFeatureCollection } from '../types/gis';
import { MapControls, BasemapOption, BASEMAP_OPTIONS } from './MapControls';
import { BufferTool, BufferResult } from './BufferTool';
import { PrintReport } from './PrintReport';
import { formatCoordinates, type CoordinateFormat } from '../gis/coordinateFormat';

const DEFAULT_ZOOM = 11;
const DEFAULT_BASEMAP_ID = 'light';
const DEFAULT_BUFFER_RADIUS = 250;
const RESIDENTS_COUNT = 45;
const RESIDENTS_RADIUS_KM = 3;

// Sample parcels shown as context near wherever the map opens.
function buildMockParcels(center: [number, number]): ParcelFeatureCollection {
  const [lng, lat] = center;
  const d = 0.0025;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { parcelId: 'PARCEL-001', zoningCode: 'C-3', acreage: 0.625 },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng - d, lat - d], [lng, lat - d], [lng, lat + d], [lng - d, lat + d], [lng - d, lat - d],
          ]],
        },
      },
      {
        type: 'Feature',
        properties: { parcelId: 'PARCEL-002', zoningCode: 'R-1', acreage: 0.42 },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng, lat - d], [lng + d, lat - d], [lng + d, lat + d], [lng, lat + d], [lng, lat - d],
          ]],
        },
      },
    ],
  };
}

function addResidentsLayer(engine: MapEngine, residents: ResidentsCollection) {
  const map = engine.getMapInstance();
  if (map.getSource('residents-source')) return;

  map.addSource('residents-source', { type: 'geojson', data: residents as any });
  map.addLayer({
    id: 'residents-layer',
    type: 'circle',
    source: 'residents-source',
    paint: {
      'circle-radius': 4,
      'circle-color': ['case', ['get', 'covered'], '#C08A46', '#475569'],
      'circle-opacity': 0.85,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#0B0D10',
    },
  });
}

export const UnifiedMapContainer: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapEngineRef = useRef<MapEngine | null>(null);
  const residentsRef = useRef<ResidentsCollection | null>(null);
  const initialViewRef = useRef<{ center: [number, number]; zoom: number }>({
    center: [0, 0],
    zoom: DEFAULT_ZOOM,
  });

  const [isResolvingLocation, setIsResolvingLocation] = useState(true);
  const [locationBadge, setLocationBadge] = useState<string | null>(null);

  const [bearing, setBearing] = useState(0);
  const [activeBasemapId, setActiveBasemapId] = useState(DEFAULT_BASEMAP_ID);

  const [bufferActive, setBufferActive] = useState(false);
  const [bufferRadius, setBufferRadius] = useState(DEFAULT_BUFFER_RADIUS);
  const [bufferResult, setBufferResult] = useState<BufferResult | null>(null);
  const [coverage, setCoverage] = useState<CoverageStats | null>(null);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('none');
  const [measurementSummary, setMeasurementSummary] = useState<string | null>(null);
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null);

  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  const bufferActiveRef = useRef(bufferActive);
  const bufferRadiusRef = useRef(bufferRadius);
  const measurementModeRef = useRef<MeasurementMode>('none');
  const measurementPointsRef = useRef<[number, number][]>([]);
  const cursorRef = useRef<{ lng: number; lat: number } | null>(null);
  const positionReadoutRef = useRef<HTMLDivElement>(null);
  const coordinateFormatRef = useRef<CoordinateFormat>('dd');

  useEffect(() => {
    document.body.classList.toggle('android-map-ui', isAndroid);
    return () => document.body.classList.remove('android-map-ui');
  }, [isAndroid]);

  useEffect(() => {
    bufferActiveRef.current = bufferActive;
  }, [bufferActive]);

  useEffect(() => {
    bufferRadiusRef.current = bufferRadius;
  }, [bufferRadius]);

  useEffect(() => {
    measurementModeRef.current = measurementMode;
    if (measurementMode === 'none') {
      measurementPointsRef.current = [];
      setMeasurementSummary(null);
      mapEngineRef.current?.clearMeasurementLayer();
      return;
    }

    if (measurementMode === 'distance') {
      setMeasurementSummary('Tap a second point to measure the geodesic distance.');
      return;
    }

    setMeasurementSummary('Click 3 or more points to calculate area and perimeter.');
  }, [measurementMode]);

  useEffect(() => {
    const map = mapEngineRef.current?.getMapInstance();
    if (map) map.getCanvas().style.cursor = bufferActive ? 'crosshair' : '';
  }, [bufferActive]);

  // ---- Resolve where the map opens: URL link > IP geolocation > location of the day ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const urlState = readMapStateFromUrl();

      if (urlState) {
        if (!cancelled) {
          initialViewRef.current = { center: urlState.center, zoom: urlState.zoom };
          setActiveBasemapId(urlState.basemapId);
          setIsResolvingLocation(false);
        }
        return;
      }

      const resolved = await resolveInitialLocation();
      if (cancelled) return;

      initialViewRef.current = { center: resolved.center, zoom: resolved.zoom };
      setLocationBadge(resolved.source === 'ip' ? `📍 Near ${resolved.name}` : `🌍 Featured today: ${resolved.name}`);
      setIsResolvingLocation(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fade the location badge after a few seconds.
  useEffect(() => {
    if (!locationBadge) return;
    const timer = setTimeout(() => setLocationBadge(null), 5000);
    return () => clearTimeout(timer);
  }, [locationBadge]);

  // ---- Create the map once the initial location has been resolved ----
  useEffect(() => {
    if (isResolvingLocation || !mapContainerRef.current) return;

    const { center, zoom } = initialViewRef.current;
    const basemapStyle = BASEMAP_OPTIONS.find((b) => b.id === activeBasemapId)?.style;

    const engine = new MapEngine(mapContainerRef.current.id, center, zoom, basemapStyle);
    mapEngineRef.current = engine;
    engine.setMaxZoom(14);
    residentsRef.current = generateMockResidents(center, RESIDENTS_RADIUS_KM, RESIDENTS_COUNT);

    const map = engine.getMapInstance();

    const handleRotate = () => setBearing(map.getBearing());
    const handleMouseMove = (e: { lngLat: { lng: number; lat: number } }) => {
      const position = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      cursorRef.current = position;
      engine.updateCursorPosition(position.lng, position.lat);
      if (positionReadoutRef.current) {
        positionReadoutRef.current.textContent = formatCoordinates(
          position.lat,
          position.lng,
          coordinateFormatRef.current,
        );
      }
    };
    const handleMouseLeave = () => {
      cursorRef.current = null;
      engine.clearCursorPosition();
      if (positionReadoutRef.current) positionReadoutRef.current.textContent = '—';
    };
    const handleMoveEnd = () => {
      const c = map.getCenter();
      writeMapStateToUrl({ center: [c.lng, c.lat], zoom: map.getZoom(), basemapId: activeBasemapId });
    };

    map.on('rotate', handleRotate);
    map.on('mousemove', handleMouseMove);
    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);
    map.getContainer().addEventListener('mouseleave', handleMouseLeave);

    const handleMapClick = (lng: number, lat: number) => {
      const position = { lng, lat };
      cursorRef.current = position;
      engine.updateCursorPosition(lng, lat);
      if (positionReadoutRef.current) {
        positionReadoutRef.current.textContent = formatCoordinates(
          lat,
          lng,
          coordinateFormatRef.current,
        );
      }

      if (measurementModeRef.current !== 'none') {
        const point: [number, number] = [lng, lat];
        const nextMeasurementPoints = [...measurementPointsRef.current, point];

        if (measurementModeRef.current === 'distance') {
          const limitedPoints = nextMeasurementPoints.slice(-2);
          measurementPointsRef.current = limitedPoints;

          if (limitedPoints.length === 2) {
            const result = measureDistanceBetweenPoints(limitedPoints[0], limitedPoints[1]);
            engine.updateMeasurementLayer(result.geometry);
            setMeasurementSummary(
              `Distance: ${result.kilometers.toFixed(2)} km · ${result.meters.toFixed(0)} m · ${result.bearing.toFixed(0)}°`,
            );
          } else {
            engine.updateMeasurementLayer({
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: limitedPoints },
              }],
            });
            setMeasurementSummary('Tap a second point to measure the geodesic distance.');
          }
          return;
        }

        if (measurementModeRef.current === 'area') {
          const areaPoints = nextMeasurementPoints;
          measurementPointsRef.current = areaPoints;

          if (areaPoints.length >= 3) {
            const result = measureAreaFromPoints(areaPoints);
            if (result) {
              engine.updateMeasurementLayer(result.geometry);
              setMeasurementSummary(
                `Area: ${result.squareKilometers.toFixed(3)} km² · Perimeter: ${result.perimeterKilometers.toFixed(2)} km`,
              );
            }
          } else {
            engine.updateMeasurementLayer({
              type: 'FeatureCollection',
              features: areaPoints.map((point) => ({
                type: 'Feature',
                properties: {},
                geometry: { type: 'Point', coordinates: point },
              })),
            });
            setMeasurementSummary('Click 3 or more points to calculate area and perimeter.');
          }
          return;
        }
      }

      if (!bufferActiveRef.current || !residentsRef.current) return;

      const radius = bufferRadiusRef.current;
      const bufferCalc = SpatialProcessor.calculateGeodesicBuffer(lng, lat, radius);
      engine.updateBufferLayer(bufferCalc.geometry);

      const bufferPolygon = bufferCalc.geometry.features[0];
      if (bufferPolygon) {
        const { scored, stats } = scoreCoverage(residentsRef.current, bufferPolygon as any);
        residentsRef.current = scored;
        const source = map.getSource('residents-source') as GeoJSONSource | undefined;
        source?.setData(scored as any);
        setCoverage(stats);
      }

      setBufferResult({
        longitude: lng,
        latitude: lat,
        radiusMeters: radius,
        areaSqKm: bufferCalc.areaSqMeters / 1_000_000,
      });
    };

    engine.onMapClick(handleMapClick);

    engine.onReady(() => {
      engine.initVectorLayers(buildMockParcels(center));
      if (residentsRef.current) addResidentsLayer(engine, residentsRef.current);
    });

    return () => {
      map.off('rotate', handleRotate);
      map.off('mousemove', handleMouseMove);
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
      map.getContainer().removeEventListener('mouseleave', handleMouseLeave);
      engine.destroy();
      mapEngineRef.current = null;
    };
    // activeBasemapId intentionally omitted — the map is created once at
    // whatever basemap was resolved; later switches go through setStyle().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResolvingLocation]);

  const handleBasemapChange = (option: BasemapOption) => {
    const map = mapEngineRef.current?.getMapInstance();
    const engine = mapEngineRef.current;
    if (!map || !engine) return;

    map.setStyle(option.style);
    engine.setMaxZoom(14);
    setActiveBasemapId(option.id);

    const c = map.getCenter();
    writeMapStateToUrl({ center: [c.lng, c.lat], zoom: map.getZoom(), basemapId: option.id });

    // setStyle() wipes custom sources/layers — re-add parcels, residents, and
    // redraw the last buffer once the new style has finished loading.
    map.once('style.load', () => {
      engine.initVectorLayers(buildMockParcels(initialViewRef.current.center));
      if (residentsRef.current) addResidentsLayer(engine, residentsRef.current);

      if (bufferResult) {
        const recomputed = SpatialProcessor.calculateGeodesicBuffer(
          bufferResult.longitude,
          bufferResult.latitude,
          bufferResult.radiusMeters,
        );
        engine.updateBufferLayer(recomputed.geometry);
      }
    });
  };

  const handleToggleBufferActive = useCallback(() => {
    setBufferActive((prev) => !prev);
  }, []);

  const handleExportGeoJSON = useCallback(() => {
    if (bufferResult) downloadBufferGeoJSON(bufferResult, coverage);
  }, [bufferResult, coverage]);

  const handleExportPdf = useCallback(() => {
    const engine = mapEngineRef.current;
    if (!engine || !bufferResult) return;

    // Capture the current view, let it paint into the (hidden-until-print)
    // report DOM node, then hand off to the browser's native print-to-PDF.
    setSnapshotDataUrl(engine.getCanvasDataUrl());
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  }, [bufferResult]);

  const handleMeasurementModeChange = useCallback((mode: MeasurementMode) => {
    setMeasurementMode((prev) => (prev === mode ? 'none' : mode));
  }, []);

  const handleClearMeasurement = useCallback(() => {
    measurementPointsRef.current = [];
    setMeasurementMode('none');
    mapEngineRef.current?.clearMeasurementLayer();
    setMeasurementSummary(null);
  }, []);

  if (isResolvingLocation) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#0B0D10] text-[#7C8791] text-sm font-sans gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C08A46] animate-pulse" />
        Finding your view…
      </div>
    );
  }

  return (
    <>
      <div id="map-container" ref={mapContainerRef} className="map-container" />

      {locationBadge && (
        <div
          className="fixed z-[9999] top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md text-xs font-medium transition-opacity duration-500"
          style={{ backgroundColor: 'rgba(20,24,29,0.95)', border: '1px solid #2A3138', color: '#E4E7EB' }}
        >
          {locationBadge}
        </div>
      )}

      <MapControls
        bearing={bearing}
        positionReadoutRef={positionReadoutRef}
        cursorPositionRef={cursorRef}
        onCoordinateFormatChange={(format) => {
          coordinateFormatRef.current = format;
          const position = cursorRef.current;
          if (positionReadoutRef.current && position) {
            positionReadoutRef.current.textContent = formatCoordinates(
              position.lat,
              position.lng,
              format,
            );
          }
        }}
        activeBasemapId={activeBasemapId}
        onBasemapChange={handleBasemapChange}
        getMap={() => mapEngineRef.current?.getMapInstance() ?? null}
        initialView={initialViewRef.current}
      />
      <BufferTool
        active={bufferActive}
        radius={bufferRadius}
        result={bufferResult}
        coverage={coverage}
        activeBasemapId={activeBasemapId}
        measurementMode={measurementMode}
        measurementSummary={measurementSummary}
        onToggleActive={handleToggleBufferActive}
        onRadiusChange={setBufferRadius}
        onMeasurementModeChange={handleMeasurementModeChange}
        onClearMeasurement={handleClearMeasurement}
        onExportGeoJSON={handleExportGeoJSON}
        onExportPdf={handleExportPdf}
      />
      <PrintReport
        result={bufferResult}
        coverage={coverage}
        snapshotDataUrl={snapshotDataUrl}
        basemapLabel={BASEMAP_OPTIONS.find((b) => b.id === activeBasemapId)?.label ?? activeBasemapId}
      />
    </>
  );
};