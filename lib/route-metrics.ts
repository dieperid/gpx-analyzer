import { type ParsedGpxRoute } from "@/lib/gpx";

export function calculateAscentRatioPerKm(
  route: ParsedGpxRoute,
): number | null {
  if (
    route.totalAscentMeters === null ||
    !Number.isFinite(route.totalDistanceMeters) ||
    route.totalDistanceMeters <= 0
  ) {
    return null;
  }

  return route.totalAscentMeters / (route.totalDistanceMeters / 1000);
}

export function calculateWeightedAverageSlope(
  route: ParsedGpxRoute,
): number | null {
  if (route.elevationProfile.length < 2) {
    return null;
  }

  let weightedAbsoluteElevationChangeMeters = 0;
  let totalMeasuredDistanceMeters = 0;

  for (let index = 1; index < route.elevationProfile.length; index += 1) {
    const previousSample = route.elevationProfile[index - 1];
    const currentSample = route.elevationProfile[index];
    const distanceDeltaMeters =
      currentSample.distanceMeters - previousSample.distanceMeters;

    if (distanceDeltaMeters <= 0) {
      continue;
    }

    weightedAbsoluteElevationChangeMeters += Math.abs(
      currentSample.elevation - previousSample.elevation,
    );
    totalMeasuredDistanceMeters += distanceDeltaMeters;
  }

  if (totalMeasuredDistanceMeters <= 0) {
    return null;
  }

  return (weightedAbsoluteElevationChangeMeters / totalMeasuredDistanceMeters) * 100;
}
