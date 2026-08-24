import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { panel, groupLabel, divider, iconBtn, labelBtn, readout, input, searchTrigger, resultRow } from './mapUiTheme';

export interface BasemapOption {
  id: string;
  label: string;
  styleUrl: string;
}

export const BASEMAP_OPTIONS: BasemapOption[] = [
  { id: 'dark', label: 'Dark', styleUrl: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
  { id: 'light', label: 'Light', styleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  { id: 'streets', label: 'Streets', styleUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
];

interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface MapControlsProps {
  bearing: number;
  cursor: { lng: number; lat: number } | null;
  activeBasemapId: string;
  onBasemapChange: (option: BasemapOption) => void;
  getMap: () => MapLibreMap | null;
  initialView: { center: [number, number]; zoom: number };
}

export const MapControls: React.FC<MapControlsProps> = ({
  bearing,
  cursor,
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

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchError(null);
    setResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(trimmed)}`,
      );
      if (!response.ok) throw new Error('Search request failed');
      const data: GeocodeResult[] = await response.json();
      setResults(data);
      if (data.length === 0) setSearchError('No results found.');
    } catch {
      setSearchError('Search failed. Try again.');
    } finally {
      setIsSearching(false);
    }
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
      <div className={`${panel} top-4 right-4 p-2 w-[168px]`}>
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
      <div className={`${panel} top-4 left-4 p-2 w-64`}>
        <div className={groupLabel}>Basemap</div>
        <div className="flex gap-1 mb-1">
          {BASEMAP_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onBasemapChange(option)}
              className={`${labelBtn(activeBasemapId === option.id)} flex-1 text-center`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className={divider} />

        <div className={groupLabel}>Search</div>

        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
                  <button key={idx} type="button" onClick={() => handleResultSelect(result)} className={resultRow}>
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
        <div className={readout}>{cursor ? `${cursor.lat.toFixed(5)}, ${cursor.lng.toFixed(5)}` : '—'}</div>
      </div>
    </>,
    document.body,
  );
};