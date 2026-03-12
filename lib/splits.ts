import { type ParsedGpxRoute } from "@/lib/gpx";

export type SplitMarker = {
  label: string;
  kind: "kilometer" | "finish";
  cumulativeDistanceMeters: number;
  estimatedTimeSeconds: number;
  latitude: number;
  longitude: number;
  elevation: number | null;
};

export function buildSplitMarkers(
  route: ParsedGpxRoute,
  targetTimeSeconds: number,
): SplitMarker[] {
  if (
    route.points.length < 2 ||
    route.totalDistanceMeters <= 0 ||
    !Number.isFinite(targetTimeSeconds) ||
    targetTimeSeconds <= 0
  ) {
    return [];
  }

  const markers: SplitMarker[] = [];
  let kilometerIndex = 1;

  for (
    let markerDistance = 1_000;
    markerDistance < route.totalDistanceMeters;
    markerDistance += 1_000
  ) {
    const point = interpolatePointAtDistance(route, markerDistance);

    markers.push({
      label: `Km ${kilometerIndex}`,
      kind: "kilometer",
      cumulativeDistanceMeters: markerDistance,
      estimatedTimeSeconds: calculateProportionalTime(
        markerDistance,
        route.totalDistanceMeters,
        targetTimeSeconds,
      ),
      latitude: point.latitude,
      longitude: point.longitude,
      elevation: point.elevation,
    });

    kilometerIndex += 1;
  }

  const finishPoint = route.points[route.points.length - 1];
  markers.push({
    label: "Finish",
    kind: "finish",
    cumulativeDistanceMeters: route.totalDistanceMeters,
    estimatedTimeSeconds: targetTimeSeconds,
    latitude: finishPoint.latitude,
    longitude: finishPoint.longitude,
    elevation: finishPoint.elevation,
  });

  return markers;
}

function calculateProportionalTime(
  cumulativeDistanceMeters: number,
  totalDistanceMeters: number,
  targetTimeSeconds: number,
): number {
  const ratio = cumulativeDistanceMeters / totalDistanceMeters;
  return Math.round(targetTimeSeconds * ratio);
}

function interpolatePointAtDistance(
  route: ParsedGpxRoute,
  targetDistanceMeters: number,
): ParsedGpxRoute["points"][number] {
  let cumulativeDistanceMeters = 0;

  for (let index = 1; index < route.points.length; index += 1) {
    const previousPoint = route.points[index - 1];
    const currentPoint = route.points[index];
    const segmentDistance = haversineDistance(previousPoint, currentPoint);
    const nextCumulativeDistance = cumulativeDistanceMeters + segmentDistance;

    if (targetDistanceMeters <= nextCumulativeDistance) {
      if (segmentDistance === 0) {
        return currentPoint;
      }

      const ratio =
        (targetDistanceMeters - cumulativeDistanceMeters) / segmentDistance;

      return {
        latitude: interpolate(previousPoint.latitude, currentPoint.latitude, ratio),
        longitude: interpolate(
          previousPoint.longitude,
          currentPoint.longitude,
          ratio,
        ),
        elevation:
          previousPoint.elevation !== null && currentPoint.elevation !== null
            ? interpolate(previousPoint.elevation, currentPoint.elevation, ratio)
            : currentPoint.elevation ?? previousPoint.elevation,
      };
    }

    cumulativeDistanceMeters = nextCumulativeDistance;
  }

  return route.points[route.points.length - 1];
}

function interpolate(start: number, end: number, ratio: number): number {
  return start + (end - start) * ratio;
}

function haversineDistance(
  start: ParsedGpxRoute["points"][number],
  end: ParsedGpxRoute["points"][number],
): number {
  const earthRadiusMeters = 6_371_000;
  const latDelta = toRadians(end.latitude - start.latitude);
  const lonDelta = toRadians(end.longitude - start.longitude);
  const startLat = toRadians(start.latitude);
  const endLat = toRadians(end.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
