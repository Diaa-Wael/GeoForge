import maplibregl, { Map, MapMouseEvent, StyleSpecification } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type { ParcelFeatureCollection } from '../types/gis';

export class MapEngine {
  private map: Map;

  constructor(containerId: string, center: [number, number], zoom: number, style?: string | StyleSpecification) {
    this.map = new maplibregl.Map({
      container: containerId,
      style: style ?? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: center,
      zoom: zoom,
      // This is a flat 2D map — lock out any rotation/pitch interaction so
      // right-click-drag or two-finger-drag can't tilt/rotate the camera.
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      // Needed so getCanvas().toDataURL() can capture the current view for
      // the PDF export report — small perf cost, acceptable for this scale.
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

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
  }

  public updateBufferLayer(bufferData: FeatureCollection): void {
    const source = this.map.getSource('buffer-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(bufferData);
    }
  }

  public toggleLayerVisibility(layerId: string, visible: boolean): void {
    if (this.map.getLayer(layerId)) {
      this.map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
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
    this.map.remove();
  }
}