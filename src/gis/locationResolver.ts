// Decides where the map opens, instead of a hardcoded default:
//   1. Silent IP-based geolocation (no permission prompt — that's what the
//      "My Location" button in MapControls is for, opt-in only).
//   2. If that fails, a curated "Location of the Day" — deterministic per
//      calendar day, so it's stable within a session but different tomorrow.

export interface ResolvedLocation {
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  source: 'ip' | 'curated';
}

interface CuratedLocation {
  name: string;
  center: [number, number];
  zoom: number;
}

const CURATED_LOCATIONS: CuratedLocation[] = [
  { name: 'Santorini, Greece', center: [25.4615, 36.3932], zoom: 12 },
  { name: 'Reykjavík, Iceland', center: [-21.9426, 64.1466], zoom: 11 },
  { name: 'Banff, Canada', center: [-115.5708, 51.1784], zoom: 11 },
  { name: 'Cape Town, South Africa', center: [18.4241, -33.9249], zoom: 11 },
  { name: 'Kyoto, Japan', center: [135.7681, 35.0116], zoom: 12 },
  { name: 'Marrakech, Morocco', center: [-7.9811, 31.6295], zoom: 12 },
  { name: 'Queenstown, New Zealand', center: [168.6626, -45.0312], zoom: 11 },
  { name: 'Dubrovnik, Croatia', center: [18.1108, 42.6507], zoom: 13 },
  { name: 'Petra, Jordan', center: [35.4444, 30.3285], zoom: 13 },
  { name: 'Cusco, Peru', center: [-71.9675, -13.5319], zoom: 12 },
  { name: 'Venice, Italy', center: [12.3155, 45.4408], zoom: 13 },
  { name: 'Ubud, Bali', center: [115.2624, -8.5069], zoom: 12 },
  { name: 'Cairo, Egypt', center: [31.2357, 30.0444], zoom: 11 },
  { name: 'Zermatt, Switzerland', center: [7.7491, 46.0207], zoom: 12 },
  { name: 'Tórshavn, Faroe Islands', center: [-6.7717, 62.0107], zoom: 11 },
  { name: 'Chefchaouen, Morocco', center: [-5.2636, 35.1714], zoom: 13 },
  { name: 'Bora Bora, French Polynesia', center: [-151.7415, -16.5004], zoom: 12 },
  { name: 'Prague, Czech Republic', center: [14.4378, 50.0755], zoom: 12 },
];

function getLocationOfTheDay(): ResolvedLocation {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  const pick = CURATED_LOCATIONS[dayOfYear % CURATED_LOCATIONS.length];
  return { ...pick, source: 'curated' };
}

async function tryIpGeolocation(): Promise<ResolvedLocation | null> {
  try {
    const controller = new AbortController();
    // Location lookup is optional; do not make the map wait several seconds
    // when the service is unavailable or slow.
    const timeout = setTimeout(() => controller.abort(), 800);

    const response = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();

    if (!data.success || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
      return null;
    }

    const place = [data.city, data.country].filter(Boolean).join(', ');

    return {
      name: place || 'Your approximate location',
      center: [data.longitude, data.latitude],
      zoom: 11,
      source: 'ip',
    };
  } catch {
    return null;
  }
}

export async function resolveInitialLocation(): Promise<ResolvedLocation> {
  const ipResult = await tryIpGeolocation();
  return ipResult ?? getLocationOfTheDay();
}