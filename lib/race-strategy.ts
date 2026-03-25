import { calculateElevationGainLoss } from "@/lib/elevation-analysis";
import { interpolateElevationAtDistance } from "@/lib/elevation-profile";
import { type ElevationSample, type ParsedGpxRoute } from "@/lib/gpx";

const MAX_GRADE_WINDOW_METERS = 100;
const MAX_GRADE_MIN_SPAN_METERS = 50;

export type RaceStrategySegment = {
  id: string;
  title: string;
  notes: string;
  pacing: string;
  nutrition: string;
  targetTime: string;
  startDistanceMeters: number;
  endDistanceMeters: number;
  source: "detected" | "custom";
  detectedSegmentId: number | null;
};

export type RaceStrategySelectionMode = "detected" | "custom";

export type RaceStrategyDraft = Omit<RaceStrategySegment, "id"> & {
  id: string | null;
};

export type RaceStrategySegmentMetrics = {
  startDistanceMeters: number;
  endDistanceMeters: number;
  distanceMeters: number;
  totalAscentMeters: number | null;
  totalDescentMeters: number | null;
  averageGradePercent: number | null;
  maxGradePercent: number | null;
};

export function normalizeStrategyRange(
  startDistanceMeters: number,
  endDistanceMeters: number,
  totalDistanceMeters: number,
): {
  startDistanceMeters: number;
  endDistanceMeters: number;
} {
  const boundedStart = clamp(startDistanceMeters, 0, totalDistanceMeters);
  const boundedEnd = clamp(endDistanceMeters, 0, totalDistanceMeters);

  return boundedStart <= boundedEnd
    ? {
      startDistanceMeters: boundedStart,
      endDistanceMeters: boundedEnd,
    }
    : {
      startDistanceMeters: boundedEnd,
      endDistanceMeters: boundedStart,
    };
}

export function calculateRaceStrategyMetrics(
  route: ParsedGpxRoute,
  startDistanceMeters: number,
  endDistanceMeters: number,
): RaceStrategySegmentMetrics {
  const normalizedRange = normalizeStrategyRange(
    startDistanceMeters,
    endDistanceMeters,
    route.totalDistanceMeters,
  );
  const distanceMeters =
    normalizedRange.endDistanceMeters - normalizedRange.startDistanceMeters;
  const samples = buildElevationSamplesForRange(
    route,
    normalizedRange.startDistanceMeters,
    normalizedRange.endDistanceMeters,
  );

  if (distanceMeters <= 0 || samples.length < 2) {
    return {
      ...normalizedRange,
      distanceMeters,
      totalAscentMeters: null,
      totalDescentMeters: null,
      averageGradePercent: null,
      maxGradePercent: null,
    };
  }

  const { gainMeters, lossMeters } = calculateElevationGainLoss(samples);
  const averageGradePercent =
    ((samples[samples.length - 1].elevation - samples[0].elevation) /
      distanceMeters) *
    100;

  return {
    ...normalizedRange,
    distanceMeters,
    totalAscentMeters: gainMeters,
    totalDescentMeters: lossMeters,
    averageGradePercent,
    maxGradePercent: getPeakGradePercent(
      samples,
      normalizedRange.startDistanceMeters,
      normalizedRange.endDistanceMeters,
      averageGradePercent,
    ),
  };
}

export function getRaceStrategySegmentsInOrder(
  segments: RaceStrategySegment[],
): RaceStrategySegment[] {
  return [...segments].sort(
    (left, right) =>
      left.startDistanceMeters - right.startDistanceMeters ||
      left.endDistanceMeters - right.endDistanceMeters ||
      left.title.localeCompare(right.title),
  );
}

function buildElevationSamplesForRange(
  route: ParsedGpxRoute,
  startDistanceMeters: number,
  endDistanceMeters: number,
): ElevationSample[] {
  if (route.elevationProfile.length < 2) {
    return [];
  }

  const samples: ElevationSample[] = [
    {
      distanceMeters: startDistanceMeters,
      elevation: interpolateElevationAtDistance(
        route.elevationProfile,
        startDistanceMeters,
      ),
    },
  ];

  for (const sample of route.elevationProfile) {
    if (
      sample.distanceMeters > startDistanceMeters &&
      sample.distanceMeters < endDistanceMeters
    ) {
      samples.push(sample);
    }
  }

  samples.push({
    distanceMeters: endDistanceMeters,
    elevation: interpolateElevationAtDistance(
      route.elevationProfile,
      endDistanceMeters,
    ),
  });

  return dedupeSamplesByDistance(samples);
}

function dedupeSamplesByDistance(samples: ElevationSample[]): ElevationSample[] {
  const sortedSamples = [...samples].sort(
    (left, right) => left.distanceMeters - right.distanceMeters,
  );
  const dedupedSamples: ElevationSample[] = [];

  for (const sample of sortedSamples) {
    const lastSample = dedupedSamples[dedupedSamples.length - 1];

    if (lastSample?.distanceMeters === sample.distanceMeters) {
      dedupedSamples[dedupedSamples.length - 1] = sample;
      continue;
    }

    dedupedSamples.push(sample);
  }

  return dedupedSamples;
}

function getPeakGradePercent(
  samples: ElevationSample[],
  startDistanceMeters: number,
  endDistanceMeters: number,
  fallbackGradePercent: number,
): number {
  const candidateDistances = samples.map((sample) => sample.distanceMeters);
  const windowedGrades = candidateDistances
    .map((distanceMeters) =>
      getWindowedGradePercent(
        samples,
        distanceMeters,
        startDistanceMeters,
        endDistanceMeters,
      ),
    )
    .filter((gradePercent): gradePercent is number => gradePercent !== null);

  if (windowedGrades.length === 0) {
    return fallbackGradePercent;
  }

  return windowedGrades.reduce((steepestGrade, gradePercent) => {
    if (Math.abs(gradePercent) > Math.abs(steepestGrade)) {
      return gradePercent;
    }

    return steepestGrade;
  }, windowedGrades[0]);
}

function getWindowedGradePercent(
  samples: ElevationSample[],
  centerDistanceMeters: number,
  segmentStartDistanceMeters: number,
  segmentEndDistanceMeters: number,
): number | null {
  const startDistanceMeters = Math.max(
    segmentStartDistanceMeters,
    centerDistanceMeters - MAX_GRADE_WINDOW_METERS / 2,
  );
  const endDistanceMeters = Math.min(
    segmentEndDistanceMeters,
    centerDistanceMeters + MAX_GRADE_WINDOW_METERS / 2,
  );
  const spanMeters = endDistanceMeters - startDistanceMeters;

  if (spanMeters < MAX_GRADE_MIN_SPAN_METERS) {
    return null;
  }

  const startElevation = interpolateElevationAtDistance(
    samples,
    startDistanceMeters,
  );
  const endElevation = interpolateElevationAtDistance(samples, endDistanceMeters);

  return ((endElevation - startElevation) / spanMeters) * 100;
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value));
}
