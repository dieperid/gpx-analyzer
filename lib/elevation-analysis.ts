import { type ElevationSample } from "@/lib/gpx";

const ELEVATION_SMOOTHING_WINDOW_METERS = 60;
const MIN_SIGNIFICANT_ELEVATION_CHANGE_METERS = 3;

export function smoothElevationSamples(
  samples: ElevationSample[],
): ElevationSample[] {
  if (samples.length < 3) {
    return samples;
  }

  const halfWindowMeters = ELEVATION_SMOOTHING_WINDOW_METERS / 2;
  const smoothedSamples: ElevationSample[] = [];
  let startIndex = 0;
  let endIndex = 0;
  let windowElevationSum = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const centerDistanceMeters = samples[index].distanceMeters;
    const windowStartMeters = centerDistanceMeters - halfWindowMeters;
    const windowEndMeters = centerDistanceMeters + halfWindowMeters;

    while (
      startIndex < samples.length &&
      samples[startIndex].distanceMeters < windowStartMeters
    ) {
      windowElevationSum -= samples[startIndex].elevation;
      startIndex += 1;
    }

    while (
      endIndex < samples.length &&
      samples[endIndex].distanceMeters <= windowEndMeters
    ) {
      windowElevationSum += samples[endIndex].elevation;
      endIndex += 1;
    }

    const sampleCount = endIndex - startIndex;
    smoothedSamples.push({
      distanceMeters: centerDistanceMeters,
      elevation:
        sampleCount > 0
          ? windowElevationSum / sampleCount
          : samples[index].elevation,
    });
  }

  return smoothedSamples;
}

export function calculateElevationGainLoss(samples: ElevationSample[]): {
  gainMeters: number | null;
  lossMeters: number | null;
} {
  if (samples.length < 2) {
    return {
      gainMeters: null,
      lossMeters: null,
    };
  }

  let gainMeters = 0;
  let lossMeters = 0;
  let lastCommittedElevation = samples[0].elevation;

  for (let index = 1; index < samples.length; index += 1) {
    const elevationDelta = samples[index].elevation - lastCommittedElevation;

    if (Math.abs(elevationDelta) < MIN_SIGNIFICANT_ELEVATION_CHANGE_METERS) {
      continue;
    }

    if (elevationDelta > 0) {
      gainMeters += elevationDelta;
    } else {
      lossMeters += Math.abs(elevationDelta);
    }

    lastCommittedElevation = samples[index].elevation;
  }

  return {
    gainMeters,
    lossMeters,
  };
}
