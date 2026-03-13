"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type ElevationSample, type ParsedGpxRoute } from "@/lib/gpx";

type TerrainCategory = "climb" | "rolling" | "descent";

type ProfileChartDatum = {
  distanceKm: number;
  elevation: number;
  climb: number | null;
  rolling: number | null;
  descent: number | null;
  gradePercent: number | null;
  segmentType: TerrainCategory | null;
  segment: ProfileSegment | null;
};

type ProfileSegment = {
  id: number;
  type: TerrainCategory;
  startIndex: number;
  endIndex: number;
  startDistanceKm: number;
  endDistanceKm: number;
  distanceKm: number;
  averageGradePercent: number;
  maxGradePercent: number;
};

const CLIMB_THRESHOLD_PERCENT = 2;
const DESCENT_THRESHOLD_PERCENT = -2;
const ORIENTATION_WINDOW_MIN_METERS = 400;
const ORIENTATION_WINDOW_MAX_METERS = 1000;
const MAX_GRADE_WINDOW_METERS = 100;
const MAX_GRADE_MIN_SPAN_METERS = 50;
const SEGMENT_INTERRUPTION_MAX_DISTANCE_KM = 0.2;
const SEGMENT_INTERRUPTION_RELATIVE_RATIO = 0.25;

const TERRAIN_STYLE: Record<
  TerrainCategory,
  {
    color: string;
    label: string;
  }
> = {
  climb: {
    color: "#ef4444",
    label: "Climb",
  },
  rolling: {
    color: "#22c55e",
    label: "Flat / hilly",
  },
  descent: {
    color: "#3b82f6",
    label: "Descent",
  },
};

export default function ElevationProfileChart({
  route,
  fullBleed = false,
}: {
  route: ParsedGpxRoute;
  fullBleed?: boolean;
}) {
  if (route.elevationProfile.length < 2) {
    return (
      <div
        className={`border-dashed border-white/15 bg-white/5 px-4 py-10 text-center text-slate-300 ${
          fullBleed ? "border-y" : "rounded-2xl border"
        }`}
      >
        Elevation data is missing or too sparse to draw a profile. Distance and
        split calculations remain available.
      </div>
    );
  }

  const chartData = buildProfileChartData(route);
  const elevations = chartData.map((sample) => sample.elevation);
  const maxElevation = Math.max(...elevations);
  const yAxisTicks = getElevationTicks(maxElevation);
  const yAxisMax = yAxisTicks[yAxisTicks.length - 1];

  return (
    <div
      className={`border-slate-200 bg-slate-50 ${
        fullBleed ? "rounded-2xl border-y px-0 py-4" : "rounded-2xl border p-4"
      }`}
    >
      <div className={`mb-4 flex flex-col gap-3 ${fullBleed ? "px-6" : ""}`}>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span>Profile</span>
          <span>{route.elevationPointCount} samples</span>
        </div>
      </div>

      <div
        className={`h-56 w-full ${fullBleed ? "pr-3" : ""}`}
        role="img"
        aria-label="Elevation profile chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 14, bottom: 6, left: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(148,163,184,0.18)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="distanceKm"
              type="number"
              domain={[0, "dataMax"]}
              tickFormatter={formatDistanceTickLabel}
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148,163,184,0.45)", strokeWidth: 1 }}
              tickLine={false}
            />
            <YAxis
              domain={[0, yAxisMax]}
              ticks={yAxisTicks}
              tickFormatter={formatElevationTickLabel}
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148,163,184,0.45)", strokeWidth: 1 }}
              tickLine={false}
              width={56}
            />
            <Tooltip
              cursor={{ stroke: "rgba(148,163,184,0.35)", strokeWidth: 1 }}
              content={<ProfileTooltip />}
            />
            <Legend />
            <Line
              dataKey="climb"
              type="monotone"
              stroke={TERRAIN_STYLE.climb.color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: TERRAIN_STYLE.climb.color }}
              connectNulls={false}
              isAnimationActive={false}
              name={TERRAIN_STYLE.climb.label}
            />
            <Line
              dataKey="rolling"
              type="monotone"
              stroke={TERRAIN_STYLE.rolling.color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: TERRAIN_STYLE.rolling.color }}
              connectNulls={false}
              isAnimationActive={false}
              name={TERRAIN_STYLE.rolling.label}
            />
            <Line
              dataKey="descent"
              type="monotone"
              stroke={TERRAIN_STYLE.descent.color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: TERRAIN_STYLE.descent.color }}
              connectNulls={false}
              isAnimationActive={false}
              name={TERRAIN_STYLE.descent.label}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        className={`mt-3 flex items-center justify-between text-xs text-slate-300 ${
          fullBleed ? "px-6" : ""
        }`}
      >
        <span className="text-slate-500">{formatElevationLabel(yAxisMax)}</span>
        <span className="text-slate-500">
          {formatDistanceLabel(route.totalDistanceMeters / 1000)}
        </span>
        <span className="text-slate-500">{formatElevationLabel(0)}</span>
      </div>
    </div>
  );
}

function buildProfileChartData(route: ParsedGpxRoute): ProfileChartDatum[] {
  const chartData = route.elevationProfile.map<ProfileChartDatum>((sample) => ({
    distanceKm: sample.distanceMeters / 1000,
    elevation: sample.elevation,
    climb: null,
    rolling: null,
    descent: null,
    gradePercent: null,
    segmentType: null,
    segment: null,
  }));
  const intervals: ProfileInterval[] = [];

  for (let index = 1; index < route.elevationProfile.length; index += 1) {
    const previousSample = route.elevationProfile[index - 1];
    const currentSample = route.elevationProfile[index];
    const distanceDeltaMeters =
      currentSample.distanceMeters - previousSample.distanceMeters;

    if (distanceDeltaMeters <= 0) {
      continue;
    }

    const gradePercent =
      ((currentSample.elevation - previousSample.elevation) /
        distanceDeltaMeters) *
      100;
    chartData[index].gradePercent = gradePercent;
    intervals.push({
      startIndex: index - 1,
      endIndex: index,
      startDistanceKm: previousSample.distanceMeters / 1000,
      endDistanceKm: currentSample.distanceMeters / 1000,
      distanceKm: distanceDeltaMeters / 1000,
      gradePercent,
      type: "rolling",
    });

    if (chartData[index - 1].gradePercent === null) {
      chartData[index - 1].gradePercent = gradePercent;
    }
  }

  const orientationWindowMeters = getOrientationWindowMeters(
    route.totalDistanceMeters,
  );
  const orientedIntervals = classifyTerrainOrientation(
    route.elevationProfile,
    intervals,
    orientationWindowMeters,
  );
  const smoothedIntervals = smoothTerrainInterruptions(orientedIntervals);

  for (const sample of chartData) {
    sample.climb = null;
    sample.rolling = null;
    sample.descent = null;
    sample.segmentType = null;
  }

  for (const interval of smoothedIntervals) {
    chartData[interval.startIndex][interval.type] =
      route.elevationProfile[interval.startIndex].elevation;
    chartData[interval.endIndex][interval.type] =
      route.elevationProfile[interval.endIndex].elevation;
    chartData[interval.startIndex].segmentType = interval.type;
    chartData[interval.endIndex].segmentType = interval.type;
  }

  const segments = buildProfileSegments(
    smoothedIntervals,
    route.elevationProfile,
  );
  for (const segment of segments) {
    for (
      let index = segment.startIndex;
      index <= segment.endIndex;
      index += 1
    ) {
      chartData[index].segment = segment;
      chartData[index].segmentType = segment.type;
    }
  }

  return chartData;
}

type ProfileInterval = {
  startIndex: number;
  endIndex: number;
  startDistanceKm: number;
  endDistanceKm: number;
  distanceKm: number;
  gradePercent: number;
  type: TerrainCategory;
};

type TerrainGroup = {
  startIntervalIndex: number;
  endIntervalIndex: number;
  type: TerrainCategory;
  distanceKm: number;
};

function classifyTerrainOrientation(
  samples: ElevationSample[],
  intervals: ProfileInterval[],
  orientationWindowMeters: number,
): ProfileInterval[] {
  return intervals.map((interval) => {
    const centerDistanceMeters =
      ((interval.startDistanceKm + interval.endDistanceKm) / 2) * 1000;
    const orientationGradePercent = getOrientationGradePercent(
      samples,
      centerDistanceMeters,
      orientationWindowMeters,
    );

    return {
      ...interval,
      type: getTerrainCategory(orientationGradePercent),
    };
  });
}

function getOrientationGradePercent(
  samples: ElevationSample[],
  centerDistanceMeters: number,
  orientationWindowMeters: number,
): number {
  const maxDistanceMeters = samples[samples.length - 1].distanceMeters;
  const halfWindowMeters = orientationWindowMeters / 2;
  const startDistanceMeters = Math.max(
    0,
    centerDistanceMeters - halfWindowMeters,
  );
  const endDistanceMeters = Math.min(
    maxDistanceMeters,
    centerDistanceMeters + halfWindowMeters,
  );

  if (endDistanceMeters <= startDistanceMeters) {
    return 0;
  }

  const startElevation = interpolateElevationAtDistance(
    samples,
    startDistanceMeters,
  );
  const endElevation = interpolateElevationAtDistance(
    samples,
    endDistanceMeters,
  );

  return (
    ((endElevation - startElevation) /
      (endDistanceMeters - startDistanceMeters)) *
    100
  );
}

function interpolateElevationAtDistance(
  samples: ElevationSample[],
  targetDistanceMeters: number,
): number {
  if (targetDistanceMeters <= samples[0].distanceMeters) {
    return samples[0].elevation;
  }

  if (targetDistanceMeters >= samples[samples.length - 1].distanceMeters) {
    return samples[samples.length - 1].elevation;
  }

  let low = 0;
  let high = samples.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const sample = samples[mid];

    if (sample.distanceMeters === targetDistanceMeters) {
      return sample.elevation;
    }

    if (sample.distanceMeters < targetDistanceMeters) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const previousSample = samples[Math.max(0, high)];
  const nextSample = samples[Math.min(samples.length - 1, low)];
  const distanceSpanMeters =
    nextSample.distanceMeters - previousSample.distanceMeters;

  if (distanceSpanMeters <= 0) {
    return nextSample.elevation;
  }

  const ratio =
    (targetDistanceMeters - previousSample.distanceMeters) / distanceSpanMeters;

  return (
    previousSample.elevation +
    (nextSample.elevation - previousSample.elevation) * ratio
  );
}

function getOrientationWindowMeters(totalDistanceMeters: number): number {
  return Math.min(
    ORIENTATION_WINDOW_MAX_METERS,
    Math.max(ORIENTATION_WINDOW_MIN_METERS, totalDistanceMeters * 0.02),
  );
}

function smoothTerrainInterruptions(
  intervals: ProfileInterval[],
): ProfileInterval[] {
  if (intervals.length < 3) {
    return intervals;
  }

  const smoothedIntervals = intervals.map((interval) => ({ ...interval }));

  while (true) {
    const groups = buildTerrainGroups(smoothedIntervals);
    let didSmooth = false;

    for (let index = 1; index < groups.length - 1; index += 1) {
      const previousGroup = groups[index - 1];
      const currentGroup = groups[index];
      const nextGroup = groups[index + 1];

      if (previousGroup.type !== nextGroup.type) {
        continue;
      }

      if (
        !shouldMergeTerrainInterruption(previousGroup, currentGroup, nextGroup)
      ) {
        continue;
      }

      for (
        let intervalIndex = currentGroup.startIntervalIndex;
        intervalIndex <= currentGroup.endIntervalIndex;
        intervalIndex += 1
      ) {
        smoothedIntervals[intervalIndex].type = previousGroup.type;
      }

      didSmooth = true;
      break;
    }

    if (!didSmooth) {
      return smoothedIntervals;
    }
  }
}

function buildTerrainGroups(intervals: ProfileInterval[]): TerrainGroup[] {
  const groups: TerrainGroup[] = [];
  let startIntervalIndex = 0;

  for (let index = 1; index <= intervals.length; index += 1) {
    const hasBoundary =
      index === intervals.length ||
      intervals[index].type !== intervals[index - 1].type;

    if (!hasBoundary) {
      continue;
    }

    groups.push({
      startIntervalIndex,
      endIntervalIndex: index - 1,
      type: intervals[index - 1].type,
      distanceKm: sumIntervalDistance(intervals, startIntervalIndex, index - 1),
    });
    startIntervalIndex = index;
  }

  return groups;
}

function shouldMergeTerrainInterruption(
  previousGroup: TerrainGroup,
  currentGroup: TerrainGroup,
  nextGroup: TerrainGroup,
): boolean {
  const shortestNeighborDistance = Math.min(
    previousGroup.distanceKm,
    nextGroup.distanceKm,
  );

  return (
    currentGroup.distanceKm <= SEGMENT_INTERRUPTION_MAX_DISTANCE_KM &&
    currentGroup.distanceKm <=
      shortestNeighborDistance * SEGMENT_INTERRUPTION_RELATIVE_RATIO
  );
}

function sumIntervalDistance(
  intervals: ProfileInterval[],
  startIndex: number,
  endIndex: number,
): number {
  let totalDistance = 0;

  for (let index = startIndex; index <= endIndex; index += 1) {
    totalDistance += intervals[index].distanceKm;
  }

  return totalDistance;
}

function buildProfileSegments(
  intervals: ProfileInterval[],
  samples: ElevationSample[],
): ProfileSegment[] {
  if (intervals.length === 0) {
    return [];
  }

  const segments: ProfileSegment[] = [];
  let currentGroup: ProfileInterval[] = [intervals[0]];

  for (let index = 1; index < intervals.length; index += 1) {
    const interval = intervals[index];

    if (interval.type === currentGroup[currentGroup.length - 1].type) {
      currentGroup.push(interval);
      continue;
    }

    segments.push(createProfileSegment(segments.length, currentGroup, samples));
    currentGroup = [interval];
  }

  segments.push(createProfileSegment(segments.length, currentGroup, samples));

  return segments;
}

function createProfileSegment(
  id: number,
  intervals: ProfileInterval[],
  samples: ElevationSample[],
): ProfileSegment {
  const firstInterval = intervals[0];
  const lastInterval = intervals[intervals.length - 1];
  const distanceKm = intervals.reduce(
    (total, interval) => total + interval.distanceKm,
    0,
  );
  const elevationDeltaMeters = intervals.reduce(
    (total, interval) =>
      total + (interval.gradePercent * interval.distanceKm * 1000) / 100,
    0,
  );

  return {
    id,
    type: firstInterval.type,
    startIndex: firstInterval.startIndex,
    endIndex: lastInterval.endIndex,
    startDistanceKm: firstInterval.startDistanceKm,
    endDistanceKm: lastInterval.endDistanceKm,
    distanceKm,
    averageGradePercent:
      distanceKm > 0 ? (elevationDeltaMeters / (distanceKm * 1000)) * 100 : 0,
    maxGradePercent: getPeakGradePercent(
      firstInterval.type,
      samples,
      firstInterval.startDistanceKm * 1000,
      lastInterval.endDistanceKm * 1000,
      distanceKm > 0 ? (elevationDeltaMeters / (distanceKm * 1000)) * 100 : 0,
    ),
  };
}

function getPeakGradePercent(
  type: TerrainCategory,
  samples: ElevationSample[],
  startDistanceMeters: number,
  endDistanceMeters: number,
  fallbackGradePercent: number,
): number {
  if (endDistanceMeters <= startDistanceMeters) {
    return fallbackGradePercent;
  }

  const candidateDistances = getSegmentCandidateDistances(
    samples,
    startDistanceMeters,
    endDistanceMeters,
  );
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

  if (type === "climb") {
    return Math.max(...windowedGrades);
  }

  if (type === "descent") {
    return Math.min(...windowedGrades);
  }

  return windowedGrades.reduce((steepestGrade, gradePercent) => {
    if (Math.abs(gradePercent) > Math.abs(steepestGrade)) {
      return gradePercent;
    }

    return steepestGrade;
  }, windowedGrades[0]);
}

function getTerrainCategory(gradePercent: number): TerrainCategory {
  if (gradePercent >= CLIMB_THRESHOLD_PERCENT) {
    return "climb";
  }

  if (gradePercent <= DESCENT_THRESHOLD_PERCENT) {
    return "descent";
  }

  return "rolling";
}

function ProfileTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ProfileChartDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const sample = payload[0].payload;
  const terrain =
    sample.segmentType !== null
      ? TERRAIN_STYLE[sample.segmentType]
      : TERRAIN_STYLE.rolling;
  const activeSegment = sample.segment;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 text-sm text-white shadow-[0_18px_48px_rgba(15,23,42,0.32)]">
      {activeSegment ? (
        <>
          <p className="font-semibold" style={{ color: terrain.color }}>
            {terrain.label} segment
          </p>
          <p className="mt-1 text-slate-300">
            Segment range:{" "}
            {formatDistanceMetersLabel(activeSegment.startDistanceKm * 1000)} to{" "}
            {formatDistanceMetersLabel(activeSegment.endDistanceKm * 1000)}
          </p>
          <p className="mt-1 text-slate-300">
            Distance:{" "}
            {formatDistanceMetersLabel(activeSegment.distanceKm * 1000)}
          </p>
          <p className="mt-1 text-slate-300">
            Average grade: {formatGradeLabel(activeSegment.averageGradePercent)}
          </p>
          <p className="mt-1 text-slate-300">
            Max grade: {formatGradeLabel(activeSegment.maxGradePercent)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-slate-300">
            <p>Distance: {formatDistanceLabel(sample.distanceKm)}</p>
            <p>Elevation: {formatElevationLabel(sample.elevation)}</p>
          </div>
        </>
      ) : sample.gradePercent !== null ? (
        <>
          <p className="font-semibold" style={{ color: terrain.color }}>
            {terrain.label}
          </p>
          <p className="mt-1 text-slate-300">
            Grade: {formatGradeLabel(sample.gradePercent)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-slate-300">
            <p>Distance: {formatDistanceLabel(sample.distanceKm)}</p>
            <p>Elevation: {formatElevationLabel(sample.elevation)}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}

function getElevationTicks(maxElevation: number): number[] {
  const stepOptions = [300, 400, 500];
  const targetTickCount = 5;
  const candidates = stepOptions.map((step) => ({
    step,
    tickCount: Math.ceil(maxElevation / step) + 1,
  }));
  const balancedCandidate =
    candidates
      .filter(
        (candidate) => candidate.tickCount >= 4 && candidate.tickCount <= 7,
      )
      .sort((left, right) => {
        const countDelta =
          Math.abs(left.tickCount - targetTickCount) -
          Math.abs(right.tickCount - targetTickCount);

        if (countDelta !== 0) {
          return countDelta;
        }

        return left.step - right.step;
      })[0] ??
    candidates.sort((left, right) => {
      if (left.tickCount !== right.tickCount) {
        return left.tickCount - right.tickCount;
      }

      return right.step - left.step;
    })[0];

  const maxTick = Math.max(
    balancedCandidate.step,
    Math.ceil(maxElevation / balancedCandidate.step) * balancedCandidate.step,
  );
  const ticks: number[] = [];

  for (let tick = 0; tick <= maxTick; tick += balancedCandidate.step) {
    ticks.push(tick);
  }

  return ticks;
}

function formatDistanceLabel(distanceKm: number): string {
  return `${distanceKm.toFixed(distanceKm >= 10 ? 0 : 1)} km`;
}

function formatDistanceTickLabel(distanceKm: number): string {
  return distanceKm.toFixed(distanceKm >= 10 ? 0 : 1);
}

function formatDistanceMetersLabel(distanceMeters: number): string {
  return `${Math.round(distanceMeters).toLocaleString("en-US")} m`;
}

function formatElevationLabel(elevationMeters: number): string {
  return `${Math.round(elevationMeters)} m`;
}

function formatElevationTickLabel(elevationMeters: number): string {
  return Math.round(elevationMeters).toString();
}

function formatGradeLabel(gradePercent: number): string {
  return `${gradePercent >= 0 ? "+" : ""}${gradePercent.toFixed(1)}%`;
}

function getSegmentCandidateDistances(
  samples: ElevationSample[],
  startDistanceMeters: number,
  endDistanceMeters: number,
): number[] {
  const candidateDistances = [startDistanceMeters, endDistanceMeters];

  for (const sample of samples) {
    if (
      sample.distanceMeters > startDistanceMeters &&
      sample.distanceMeters < endDistanceMeters
    ) {
      candidateDistances.push(sample.distanceMeters);
    }
  }

  return candidateDistances;
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
  const endElevation = interpolateElevationAtDistance(
    samples,
    endDistanceMeters,
  );

  return ((endElevation - startElevation) / spanMeters) * 100;
}
