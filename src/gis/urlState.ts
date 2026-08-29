// Reads/writes map view state (center, zoom, basemap) to the URL query
// string so a copied link reproduces the same view — same idea as Google
// Maps' shareable URLs.

export interface UrlMapState {
  center: [number, number]; // [lng, lat]
  zoom: number;
  basemapId: string;
}

export function readMapStateFromUrl(): UrlMapState | null {
  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get('lat') ?? '');
  const lng = parseFloat(params.get('lng') ?? '');
  const zoom = parseFloat(params.get('z') ?? '');
  const basemapId = params.get('basemap');

  if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(zoom)) {
    return null;
  }

  return {
    center: [lng, lat],
    zoom,
    basemapId: basemapId ?? 'light',
  };
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced so continuous pan/zoom doesn't spam history.replaceState.
 * Uses replaceState (not pushState) so panning around doesn't pollute
 * the browser's back-button history.
 */
export function writeMapStateToUrl(state: UrlMapState): void {
  if (writeTimer) clearTimeout(writeTimer);

  writeTimer = setTimeout(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('lat', state.center[1].toFixed(5));
    params.set('lng', state.center[0].toFixed(5));
    params.set('z', state.zoom.toFixed(2));
    params.set('basemap', state.basemapId);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, 400);
}