const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export function mapTilerStyle(mapId: string): string {
  if (!MAPTILER_API_KEY) {
    throw new Error(
      'Missing VITE_MAPTILER_API_KEY. Add your MapTiler API key to the local environment before starting the app.',
    );
  }

  return `https://api.maptiler.com/maps/${mapId}/style.json?key=${encodeURIComponent(MAPTILER_API_KEY)}`;
}
