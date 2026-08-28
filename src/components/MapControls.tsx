import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import type { RefObject } from 'react';
import { formatCoordinates, type CoordinateFormat } from '../gis/coordinateFormat';
import {
  panel,
  groupLabel,
  divider,
  iconBtn,
  labelBtn,
  readout,
  input,
  searchTrigger,
  resultRow,
  getGisUiThemeStyle,
} from './mapUiTheme';

export interface BasemapOption {
  id: string;
  label: string;
  style: string | StyleSpecification;
}

const ESRI_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics, and the GIS User Community';
const RASTER_TILE_PAINT = {
  'raster-fade-duration': 0,
  'raster-resampling': 'linear',
} as const;

export const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'dark',
    label: 'Dark',
    style: {
      version: 8,
      sources: {
        'esri-dark-base': {
          type: 'raster',
          tiles: ['https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 14,
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        },
        'esri-dark-reference': {
          type: 'raster',
          tiles: ['https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 14,
        },
      },
      layers: [
        { id: 'esri-dark-loading-background', type: 'background', paint: { 'background-color': '#17212b' } },
        { id: 'esri-dark-base-layer', type: 'raster', source: 'esri-dark-base', paint: RASTER_TILE_PAINT },
        { id: 'esri-dark-reference-layer', type: 'raster', source: 'esri-dark-reference', paint: RASTER_TILE_PAINT },
      ],
    },
  },
  {
    id: 'light',
    label: 'Light',
    style: {
      version: 8,
      sources: {
        'esri-light-base': {
          type: 'raster',
          tiles: ['https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 14,
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        },
        'esri-light-reference': {
          type: 'raster',
          tiles: ['https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 14,
        },
      },
      layers: [
        { id: 'esri-light-loading-background', type: 'background', paint: { 'background-color': '#e8eef5' } },
        { id: 'esri-light-base-layer', type: 'raster', source: 'esri-light-base', paint: RASTER_TILE_PAINT },
        { id: 'esri-light-reference-layer', type: 'raster', source: 'esri-light-reference', paint: RASTER_TILE_PAINT },
      ],
    },
  },
  {
    id: 'streets',
    label: 'Streets',
    style: {
      version: 8,
      sources: {
        'esri-streets': {
          type: 'raster',
          tiles: ['https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 14,
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, USGS',
        },
      },
      layers: [
        { id: 'esri-streets-loading-background', type: 'background', paint: { 'background-color': '#e8eef5' } },
        { id: 'esri-streets-layer', type: 'raster', source: 'esri-streets', paint: RASTER_TILE_PAINT },
      ],
    },
  },
  {
    id: 'satellite',
    label: 'Satellite',
    style: {
      version: 8,
      sources: {
        'esri-imagery': {
          type: 'raster',
          // Note: Esri's REST tile scheme is {z}/{y}/{x} — not the usual {z}/{x}/{y}.
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 14,
          attribution: ESRI_ATTRIBUTION,
        },
      },
      layers: [
        { id: 'esri-imagery-loading-background', type: 'background', paint: { 'background-color': '#9ca3af' } },
        { id: 'esri-imagery-layer', type: 'raster', source: 'esri-imagery', paint: RASTER_TILE_PAINT },
      ],
    },
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    style: {
      version: 8,
      sources: {
        'esri-imagery': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 14,
          attribution: ESRI_ATTRIBUTION,
        },
        'esri-labels': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 14,
        },
      },
      layers: [
        { id: 'esri-hybrid-loading-background', type: 'background', paint: { 'background-color': '#9ca3af' } },
        { id: 'esri-imagery-layer', type: 'raster', source: 'esri-imagery', paint: RASTER_TILE_PAINT },
        { id: 'esri-labels-layer', type: 'raster', source: 'esri-labels', paint: RASTER_TILE_PAINT },
      ],
    },
  },
  {
    id: 'topo',
    label: 'Topo',
    style: {
      version: 8,
      sources: {
        'esri-topo': {
          type: 'raster',
          tiles: ['https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          maxzoom: 18,
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS',
        },
      },
      layers: [
        { id: 'esri-topo-loading-background', type: 'background', paint: { 'background-color': '#e5edf0' } },
        { id: 'esri-topo-layer', type: 'raster', source: 'esri-topo', paint: RASTER_TILE_PAINT },
      ],
    },
  },
];

interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface MapControlsProps {
  bearing: number;
  positionReadoutRef: React.RefObject<HTMLDivElement | null>;
  cursorPositionRef: RefObject<{ lng: number; lat: number } | null>;
  onCoordinateFormatChange: (format: CoordinateFormat) => void;
  activeBasemapId: string;
  onBasemapChange: (option: BasemapOption) => void;
  getMap: () => MapLibreMap | null;
  initialView: { center: [number, number]; zoom: number };
}

export const MapControls: React.FC<MapControlsProps> = ({
  bearing,
  positionReadoutRef,
  cursorPositionRef,
  onCoordinateFormatChange,
  activeBasemapId,
  onBasemapChange,
  getMap,
  initialView,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isBasemapOpen, setIsBasemapOpen] = useState(true);
  const [coordinateFormat, setCoordinateFormat] = useState<CoordinateFormat>('dd');
  const [highlightedResult, setHighlightedResult] = useState(-1);
  const searchRequestRef = React.useRef<AbortController | null>(null);
  const mapUiThemeStyle = getGisUiThemeStyle(activeBasemapId);

  useEffect(() => {
    const position = cursorPositionRef.current;
    if (positionReadoutRef.current && position) {
      positionReadoutRef.current.textContent = formatCoordinates(position.lat, position.lng, coordinateFormat);
    }
  }, [coordinateFormat, cursorPositionRef, positionReadoutRef]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => getMap()?.zoomIn({ duration: 300 });
  const handleZoomOut = () => getMap()?.zoomOut({ duration: 300 });
  const handleResetNorth = () => getMap()?.resetNorth({ duration: 400 });

  const handleHome = () => {
    getMap()?.flyTo({ center: initialView.center, zoom: initialView.zoom, bearing: 0, pitch: 0, duration: 1200 });
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation not supported in this browser.');
      return;
    }
    setIsLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        getMap()?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 14, duration: 1500 });
      },
      () => {
        setIsLocating(false);
        setLocateError('Location permission denied or unavailable.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const performSearch = useCallback(async (trimmed: string) => {
    searchRequestRef.current?.abort();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    searchRequestRef.current = controller;
    setIsSearching(true);
    setSearchError(null);
    setResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(trimmed)}`,
        {
          // Browsers intentionally forbid setting User-Agent. The browser
          // supplies its own UA; a server-side proxy is needed for an app UA.
          headers: {
            Accept: 'application/json',
            'Accept-Language': 'en',
          },
          referrerPolicy: 'strict-origin-when-cross-origin',
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new Error('Search request failed');
      const data: GeocodeResult[] = await response.json();
      setResults(data);
      if (data.length === 0) setSearchError('No results found.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setSearchError('Search failed. Try again.');
    } finally {
      if (searchRequestRef.current === controller) setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => {
      void performSearch(query.trim());
    }, 450);
    return () => window.clearTimeout(timer);
  }, [performSearch, query, searchOpen]);

  useEffect(() => {
    setHighlightedResult(-1);
  }, [results]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setHighlightedResult((index) => (index + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setHighlightedResult((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (e.key === 'Enter' && highlightedResult >= 0 && results[highlightedResult]) {
      e.preventDefault();
      handleResultSelect(results[highlightedResult]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSearchOpen(false);
      setResults([]);
      setQuery('');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performSearch(query.trim());
  };

  const handleResultSelect = (result: GeocodeResult) => {
    getMap()?.flyTo({ center: [parseFloat(result.lon), parseFloat(result.lat)], zoom: 14, duration: 1500 });
    setResults([]);
    setSearchOpen(false);
    setQuery('');
  };

  return createPortal(
    <>
      {/* Right side: navigation cluster */}
      <div className={`${panel} gis-nav-panel top-4 right-4 p-2`} style={{ ...mapUiThemeStyle, width: 'min(11rem, calc(100vw - 2rem))' }}>
        <div className={groupLabel}>Navigate</div>

        <div className="flex gap-1">
          <button type="button" onClick={handleZoomIn} className={`${iconBtn(false)} flex-1`} aria-label="Zoom in" title="Zoom in">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" onClick={handleZoomOut} className={`${iconBtn(false)} flex-1`} aria-label="Zoom out" title="Zoom out">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleResetNorth}
            className={`${iconBtn(Math.abs(bearing) > 0.5)} flex-1`}
            aria-label="Reset north"
            title="Reset north"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              style={{ transform: `rotate(${-bearing}deg)`, transition: 'transform 0.2s ease-out' }}
            >
              <path d="M12 2 L15.5 12 L12 9.8 L8.5 12 Z" fill="currentColor" />
              <path d="M12 22 L15.5 12 L12 14.2 L8.5 12 Z" fill="currentColor" fillOpacity="0.35" />
            </svg>
          </button>
        </div>

        <div className={divider} />

        <div className="flex gap-1">
          <button type="button" onClick={handleHome} className={`${iconBtn(false)} flex-1`} aria-label="Reset view" title="Reset view">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 7 L8 2 L14 7 M4 6.5 V14 H12 V6.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleFullscreenToggle}
            className={`${iconBtn(isFullscreen)} flex-1`}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 2v3a1 1 0 0 1-1 1H2M10 2v3a1 1 0 0 0 1 1h3M6 14v-3a1 1 0 0 0-1-1H2M10 14v-3a1 1 0 0 1 1-1h3"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={isLocating}
            className={`${iconBtn(false)} flex-1`}
            aria-label="My location"
            title={locateError ?? 'My location'}
          >
            {isLocating ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="animate-spin">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2" fill="currentColor" />
                <path d="M8 1v2.2M8 12.8V15M1 8h2.2M12.8 8H15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Left side: basemap, search, position */}
      <div
        className={`${panel} gis-basemap-panel top-4 left-4 p-2 transition-all duration-200`}
        style={{
          ...mapUiThemeStyle,
          width: isBasemapOpen ? 'min(18rem, calc(100vw - 2rem))' : 'min(12rem, calc(100vw - 2rem))',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className={groupLabel}>Basemap</div>
          <button
            type="button"
            onClick={() => setIsBasemapOpen((prev) => !prev)}
            className="gis-btn gis-icon-btn gis-collapse-btn"
            aria-label={isBasemapOpen ? 'Collapse basemap list' : 'Expand basemap list'}
            title={isBasemapOpen ? 'Collapse basemap list' : 'Expand basemap list'}
            style={{ width: '24px', height: '24px', fontSize: '12px' }}
          >
            {isBasemapOpen ? '−' : '+'}
          </button>
        </div>

        {isBasemapOpen && (
          <div className="mb-1 flex flex-col gap-1.5">
            {BASEMAP_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onBasemapChange(option)}
                className={`${labelBtn(activeBasemapId === option.id)} justify-between text-left`}
                style={{ width: '100%' }}
              >
                <span>{option.label}</span>
                <span className="text-[10px] opacity-75">{activeBasemapId === option.id ? 'Current' : 'Select'}</span>
              </button>
            ))}
          </div>
        )}

        {!isBasemapOpen && (
          <div className="mb-1 text-[10px] text-[var(--gis-text-faint)] uppercase tracking-[0.12em]">
            {BASEMAP_OPTIONS.find((option) => option.id === activeBasemapId)?.label ?? 'Basemap'}
          </div>
        )}

        <div className={divider} />

        <div className={groupLabel}>Search</div>

        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Place name or address"
                autoFocus
                className={input}
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setResults([]);
                  setQuery('');
                  setSearchError(null);
                }}
                className={`${iconBtn(false)} flex-shrink-0`}
                style={{ width: '28px', height: '28px' }}
                aria-label="Close search"
                title="Close search"
              >
                ✕
              </button>
            </div>

            {isSearching && <p className="text-[10px] px-1 text-[var(--gis-text-muted)]">Searching…</p>}
            {searchError && <p className="text-[10px] px-1" style={{ color: '#b5674f' }}>{searchError}</p>}

            {results.length > 0 && (
              <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                {results.map((result, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleResultSelect(result)}
                    className={`${resultRow} ${highlightedResult === idx ? 'gis-result-row-highlighted' : ''}`}
                    aria-selected={highlightedResult === idx}
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}
          </form>
        ) : (
          <button type="button" onClick={() => setSearchOpen(true)} className={searchTrigger}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11 L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Search a place
          </button>
        )}

        <div className={divider} />

        <div className={groupLabel}>Position</div>
        <div className="gis-coordinate-toggle" role="group" aria-label="Coordinate format">
          {(['dd', 'dms'] as CoordinateFormat[]).map((format) => (
            <button
              key={format}
              type="button"
              className={`gis-btn ${coordinateFormat === format ? 'gis-btn-active' : ''}`}
              onClick={() => {
                setCoordinateFormat(format);
                onCoordinateFormatChange(format);
              }}
            >
              {format === 'dd' ? 'DD' : 'DMS'}
            </button>
          ))}
        </div>
        <div ref={positionReadoutRef} className={readout}>—</div>
      </div>
    </>,
    document.body,
  );
};