import { type ParsedGpxRoute } from "@/lib/gpx";

export type SplitMarker = {
  label: string;
  kind: "kilometer" | "finish";
  cumulativeDistanceMeters: number;
  estimatedTimeSeconds: number;
  elevationGainMeters: number | null;
  elevationLossMeters: number | null;
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
  const cumulativeDistances = buildCumulativeDistances(route);
  let kilometerIndex = 1;
  let previousMarkerDistance = 0;

  for (
    let markerDistance = 1_000;
    markerDistance < route.totalDistanceMeters;
    markerDistance += 1_000
  ) {
    const point = interpolatePointAtDistanceWithCumulativeDistances(
      route,
      cumulativeDistances,
      markerDistance,
    );
    const elevationChange = calculateElevationChangeInRange(
      route,
      cumulativeDistances,
      previousMarkerDistance,
      markerDistance,
    );

    markers.push({
      label: `Km ${kilometerIndex}`,
      kind: "kilometer",
      cumulativeDistanceMeters: markerDistance,
      estimatedTimeSeconds: calculateProportionalTime(
        markerDistance,
        route.totalDistanceMeters,
        targetTimeSeconds,
      ),
      elevationGainMeters: elevationChange.gainMeters,
      elevationLossMeters: elevationChange.lossMeters,
      latitude: point.latitude,
      longitude: point.longitude,
      elevation: point.elevation,
    });

    previousMarkerDistance = markerDistance;
    kilometerIndex += 1;
  }

  const finishPoint = route.points[route.points.length - 1];
  const finishElevationChange = calculateElevationChangeInRange(
    route,
    cumulativeDistances,
    previousMarkerDistance,
    route.totalDistanceMeters,
  );
  markers.push({
    label: "Finish",
    kind: "finish",
    cumulativeDistanceMeters: route.totalDistanceMeters,
    estimatedTimeSeconds: targetTimeSeconds,
    elevationGainMeters: finishElevationChange.gainMeters,
    elevationLossMeters: finishElevationChange.lossMeters,
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

function interpolatePointAtDistanceWithCumulativeDistances(
  route: ParsedGpxRoute,
  cumulativeDistances: number[],
  targetDistanceMeters: number,
): ParsedGpxRoute["points"][number] {
  let cumulativeDistanceMeters = 0;

  for (let index = 1; index < route.points.length; index += 1) {
    const previousPoint = route.points[index - 1];
    const currentPoint = route.points[index];
    const nextCumulativeDistance = cumulativeDistances[index];
    const segmentDistance = nextCumulativeDistance - cumulativeDistanceMeters;

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

function calculateElevationChangeInRange(
  route: ParsedGpxRoute,
  cumulativeDistances: number[],
  fromDistanceMeters: number,
  toDistanceMeters: number,
): {
  gainMeters: number | null;
  lossMeters: number | null;
} {
  const samples: Array<{ distanceMeters: number; elevation: number }> = [];
  const startPoint = interpolatePointAtDistanceWithCumulativeDistances(
    route,
    cumulativeDistances,
    fromDistanceMeters,
  );
  const endPoint = interpolatePointAtDistanceWithCumulativeDistances(
    route,
    cumulativeDistances,
    toDistanceMeters,
  );

  if (startPoint.elevation !== null) {
    samples.push({
      distanceMeters: fromDistanceMeters,
      elevation: startPoint.elevation,
    });
  }

  for (let index = 1; index < route.points.length - 1; index += 1) {
    const distanceMeters = cumulativeDistances[index];
    const elevation = route.points[index].elevation;

    if (
      distanceMeters > fromDistanceMeters &&
      distanceMeters < toDistanceMeters &&
      elevation !== null
    ) {
      samples.push({
        distanceMeters,
        elevation,
      });
    }
  }

  if (endPoint.elevation !== null) {
    samples.push({
      distanceMeters: toDistanceMeters,
      elevation: endPoint.elevation,
    });
  }

  if (samples.length < 2) {
    return {
      gainMeters: null,
      lossMeters: null,
    };
  }

  samples.sort((left, right) => left.distanceMeters - right.distanceMeters);

  let gainMeters = 0;
  let lossMeters = 0;

  for (let index = 1; index < samples.length; index += 1) {
    const elevationDelta = samples[index].elevation - samples[index - 1].elevation;

    if (elevationDelta > 0) {
      gainMeters += elevationDelta;
    } else if (elevationDelta < 0) {
      lossMeters += Math.abs(elevationDelta);
    }
  }

  return {
    gainMeters,
    lossMeters,
  };
}

function buildCumulativeDistances(route: ParsedGpxRoute): number[] {
  const cumulativeDistances = [0];

  for (let index = 1; index < route.points.length; index += 1) {
    cumulativeDistances.push(
      cumulativeDistances[index - 1] +
        haversineDistance(route.points[index - 1], route.points[index]),
    );
  }

  return cumulativeDistances;
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
