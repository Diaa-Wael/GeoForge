export type CoordinateFormat = 'dd' | 'dms';

function formatDms(value: number, isLatitude: boolean): string {
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(2);
  const direction = isLatitude
    ? value < 0 ? 'S' : 'N'
    : value < 0 ? 'W' : 'E';

  return `${degrees}°${minutes}'${seconds}"${direction}`;
}

export function formatCoordinates(
  latitude: number,
  longitude: number,
  format: CoordinateFormat,
): string {
  if (format === 'dms') {
    return `${formatDms(latitude, true)}, ${formatDms(longitude, false)}`;
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
