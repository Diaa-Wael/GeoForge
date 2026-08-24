import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapEngine } from '../gis/MapEngine';
import { SpatialProcessor } from '../gis/SpatialProcessor';
import type { ParcelFeatureCollection } from '../types/gis';
import { MapControls, BasemapOption } from './MapControls';
import { BufferTool, BufferResult } from './BufferTool';

// Centered near Mt. Fuji; change freely.
const INITIAL_CENTER: [number, number] = [138.7398, 35.3776]; // [lng, lat]
const INITIAL_ZOOM = 11;
const INITIAL_BASEMAP_ID = 'dark'; // matches the style already baked into MapEngine.ts
const DEFAULT_BUFFER_RADIUS = 250;

// Sample parcels near the initial view, shown as context for the buffer tool.
const MOCK_PARCELS: ParcelFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { parcelId: 'PARCEL-001', zoningCode: 'C-3', acreage: 0.625 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [138.7348, 35.3746],
          [138.7398, 35.3746],
          [138.7398, 35.3796],
          [138.7348, 35.3796],
          [138.7348, 35.3746],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { parcelId: 'PARCEL-002', zoningCode: 'R-1', acreage: 0.42 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [138.7398, 35.3746],
          [138.7448, 35.3746],
          [138.7448, 35.3796],
          [138.7398, 35.3796],
          [138.7398, 35.3746],
        ]],
      },
    },
  ],
};

export const UnifiedMapContainer: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapEngineRef = useRef<MapEngine | null>(null);

  const [bearing, setBearing] = useState(0);
  const [cursor, setCursor] = useState<{ lng: number; lat: number } | null>(null);
  const [activeBasemapId, setActiveBasemapId] = useState(INITIAL_BASEMAP_ID);

  const [bufferActive, setBufferActive] = useState(false);
  const [bufferRadius, setBufferRadius] = useState(DEFAULT_BUFFER_RADIUS);
  const [bufferResult, setBufferResult] = useState<BufferResult | null>(null);

  // Refs mirroring buffer state so the one-time click handler never sees stale values.
  const bufferActiveRef = useRef(bufferActive);
  const bufferRadiusRef = useRef(bufferRadius);

  useEffect(() => {
    bufferActiveRef.current = bufferActive;
  }, [bufferActive]);

  useEffect(() => {
    bufferRadiusRef.current = bufferRadius;
  }, [bufferRadius]);

  // Toggle the map cursor to a crosshair while the buffer tool is active.
  useEffect(() => {
    const map = mapEngineRef.current?.getMapInstance();
    if (map) {
      map.getCanvas().style.cursor = bufferActive ? 'crosshair' : '';
    }
  }, [bufferActive]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const engine = new MapEngine(mapContainerRef.current.id, INITIAL_CENTER, INITIAL_ZOOM);
    mapEngineRef.current = engine;

    const map = engine.getMapInstance();

    const handleRotate = () => setBearing(map.getBearing());
    const handleMouseMove = (e: { lngLat: { lng: number; lat: number } }) =>
      setCursor({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    const handleMouseLeave = () => setCursor(null);

    map.on('rotate', handleRotate);
    map.on('mousemove', handleMouseMove);
    map.getContainer().addEventListener('mouseleave', handleMouseLeave);

    engine.onReady(() => {
      engine.initVectorLayers(MOCK_PARCELS);

      engine.onMapClick((lng, lat) => {
        if (!bufferActiveRef.current) return;

        const radius = bufferRadiusRef.current;
        const result = SpatialProcessor.calculateGeodesicBuffer(lng, lat, radius);
        engine.updateBufferLayer(result.geometry);

        setBufferResult({
          longitude: lng,
          latitude: lat,
          radiusMeters: radius,
          areaSqKm: result.areaSqMeters / 1_000_000,
        });
      });
    });

    return () => {
      map.off('rotate', handleRotate);
      map.off('mousemove', handleMouseMove);
      map.getContainer().removeEventListener('mouseleave', handleMouseLeave);
      engine.destroy();
      mapEngineRef.current = null;
    };
  }, []);

  const handleBasemapChange = (option: BasemapOption) => {
    const map = mapEngineRef.current?.getMapInstance();
    const engine = mapEngineRef.current;
    if (!map || !engine) return;

    map.setStyle(option.styleUrl);
    setActiveBasemapId(option.id);

    // setStyle() wipes custom sources/layers, so re-add parcels + re-draw the
    // last buffer (if any) once the new style has finished loading.
    map.once('style.load', () => {
      engine.initVectorLayers(MOCK_PARCELS);

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

  return (
    <>
      <div id="map-container" ref={mapContainerRef} style={{ width: '100%', height: '100vh' }} />
      <MapControls
        bearing={bearing}
        cursor={cursor}
        activeBasemapId={activeBasemapId}
        onBasemapChange={handleBasemapChange}
        getMap={() => mapEngineRef.current?.getMapInstance() ?? null}
        initialView={{ center: INITIAL_CENTER, zoom: INITIAL_ZOOM }}
      />
      <BufferTool
        active={bufferActive}
        radius={bufferRadius}
        result={bufferResult}
        onToggleActive={handleToggleBufferActive}
        onRadiusChange={setBufferRadius}
      />
    </>
  );
};