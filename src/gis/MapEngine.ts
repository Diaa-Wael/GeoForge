import maplibregl, { Map, MapMouseEvent, StyleSpecification } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type { ParcelFeatureCollection } from '../types/gis';

export class MapEngine {
  private map: Map;
  private pendingBufferData: FeatureCollection | null = null;
  private pendingMeasurementData: FeatureCollection | null = null;
  private pendingCursor: [number, number] | null = null;
  private cursorFrame: number | null = null;

  constructor(containerId: string, center: [number, number], zoom: number, style?: string | StyleSpecification) {
    if (typeof maplibregl.setRTLTextPlugin === 'function') {
      maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js', true);
    }

    const isTouchDevice =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches;

    this.map = new maplibregl.Map({
      container: containerId,
      style: style ?? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: center,
      zoom: zoom,
      maxZoom: 14,
      renderWorldCopies: false,
      refreshExpiredTiles: false,
      // Keep more nearby tiles on desktop, but avoid excessive RAM use on
      // phones and tablets while still retaining parent/adjacent zoom tiles.
      maxTileCacheSize: isTouchDevice ? 256 : 768,
      maxTileCacheZoomLevels: isTouchDevice ? 6 : 10,
      fadeDuration: 0,
      cancelPendingTileRequestsWhileZooming: true,
      collectResourceTiming: false,
      // This is a flat 2D map — lock out any rotation/pitch interaction so
      // right-click-drag or two-finger-drag can't tilt/rotate the camera.
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      // Needed so getCanvas().toDataURL() can capture the current view for
      // the PDF export report — small perf cost, acceptable for this scale.
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    this.map.setRenderWorldCopies(false);
    this.map.setMaxZoom(14);
    this.map.touchZoomRotate.disableRotation();
    this.map.keyboard.disableRotation();
  }

  public onReady(callback: () => void): void {
    this.map.on('load', callback);
  }

  public initVectorLayers(parcels: ParcelFeatureCollection): void {
    if (this.map.getSource('parcels-source')) return;

    this.map.addSource('parcels-source', {
      type: 'geojson',
      data: parcels,
    });

    this.map.addLayer({
      id: 'parcels-fill',
      type: 'fill',
      source: 'parcels-source',
      paint: {
        'fill-color': '#38bdf8',
        'fill-opacity': 0.3,
      },
    });

    this.map.addLayer({
      id: 'parcels-line',
      type: 'line',
      source: 'parcels-source',
      paint: {
        'line-color': '#38bdf8',
        'line-width': 2,
      },
    });

    this.map.addSource('buffer-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    this.map.addLayer({
      id: 'buffer-fill',
      type: 'fill',
      source: 'buffer-source',
      paint: {
        'fill-color': '#f43f5e',
        'fill-opacity': 0.4,
      },
    });

    this.map.addSource('cursor-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    this.map.addSource('measurement-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    this.map.addLayer({
      id: 'measurement-line',
      type: 'line',
      source: 'measurement-source',
      paint: {
        'line-color': '#22c55e',
        'line-width': 3,
        'line-dasharray': [2, 1.5],
      },
    });

    this.map.addLayer({
      id: 'measurement-fill',
      type: 'fill',
      source: 'measurement-source',
      paint: {
        'fill-color': '#22c55e',
        'fill-opacity': 0.22,
      },
    });

    this.map.addLayer({
      id: 'measurement-point',
      type: 'circle',
      source: 'measurement-source',
      paint: {
        'circle-radius': 5,
        'circle-color': '#bbf7d0',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#14532d',
      },
    });

    if (this.pendingBufferData) {
      (this.map.getSource('buffer-source') as maplibregl.GeoJSONSource).setData(this.pendingBufferData);
      this.pendingBufferData = null;
    }

    if (this.pendingMeasurementData) {
      (this.map.getSource('measurement-source') as maplibregl.GeoJSONSource).setData(this.pendingMeasurementData);
      this.pendingMeasurementData = null;
    }
  }

  public updateCursorPosition(longitude: number, latitude: number): void {
    this.pendingCursor = [longitude, latitude];
    if (this.cursorFrame !== null) return;

    this.cursorFrame = requestAnimationFrame(() => {
      this.cursorFrame = null;
      const coordinates = this.pendingCursor;
      if (!coordinates) return;

      const source = this.map.getSource('cursor-source') as maplibregl.GeoJSONSource | undefined;
      source?.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates },
        }],
      });
    });
  }

  public clearCursorPosition(): void {
    this.pendingCursor = null;
    if (this.cursorFrame !== null) {
      cancelAnimationFrame(this.cursorFrame);
      this.cursorFrame = null;
    }
    const source = this.map.getSource('cursor-source') as maplibregl.GeoJSONSource | undefined;
    source?.setData({ type: 'FeatureCollection', features: [] });
  }

  public updateBufferLayer(bufferData: FeatureCollection): void {
    const source = this.map.getSource('buffer-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(bufferData);
      return;
    }

    this.pendingBufferData = bufferData;
  }

  public updateMeasurementLayer(measurementData: FeatureCollection): void {
    const source = this.map.getSource('measurement-source') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(measurementData);
      return;
    }

    this.pendingMeasurementData = measurementData;
  }

  public clearMeasurementLayer(): void {
    const source = this.map.getSource('measurement-source') as maplibregl.GeoJSONSource | undefined;
    source?.setData({ type: 'FeatureCollection', features: [] });
    this.pendingMeasurementData = null;
  }

  public toggleLayerVisibility(layerId: string, visible: boolean): void {
    if (this.map.getLayer(layerId)) {
      this.map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
  }

  public setMaxZoom(maxZoom: number): void {
    this.map.setMaxZoom(maxZoom);
    if (this.map.getZoom() > maxZoom) {
      this.map.setZoom(maxZoom);
    }
  }

  public onMapClick(handler: (lng: number, lat: number) => void): void {
    this.map.on('click', (e: MapMouseEvent) => {
      handler(e.lngLat.lng, e.lngLat.lat);
    });
  }

  public getCanvasDataUrl(): string {
    return this.map.getCanvas().toDataURL('image/png');
  }

  public getMapInstance(): Map {
    return this.map;
  }

  public destroy(): void {
    this.clearCursorPosition();
    this.map.remove();
  }
}