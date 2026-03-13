"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type ParsedGpxRoute } from "@/lib/gpx";

type TerrainCategory = "climb" | "rolling" | "descent";

type ProfileChartDatum = {
  distanceKm: number;
  elevation: number;
  climb: number | null;
  rolling: number | null;
  descent: number | null;
  gradePercent: number | null;
  segmentType: TerrainCategory | null;
};

const CLIMB_THRESHOLD_PERCENT = 2;
const DESCENT_THRESHOLD_PERCENT = -2;

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
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);

  return (
    <div
      className={`border-white/10 bg-white/5 ${
        fullBleed ? "rounded-2xl border-y px-0 py-4" : "rounded-2xl border p-4"
      }`}
    >
      <div className={`mb-4 flex flex-col gap-3 ${fullBleed ? "px-6" : ""}`}>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
          <span>Profile</span>
          <span>{route.elevationPointCount} samples</span>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
          {(
            Object.entries(TERRAIN_STYLE) as Array<
              [TerrainCategory, (typeof TERRAIN_STYLE)[TerrainCategory]]
            >
          ).map(([key, terrain]) => (
            <span
              key={key}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: terrain.color }}
              />
              {terrain.label}
            </span>
          ))}
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
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatDistanceLabel}
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[
                (dataMin: number) => Math.floor((dataMin - 10) / 10) * 10,
                (dataMax: number) => Math.ceil((dataMax + 10) / 10) * 10,
              ]}
              tickFormatter={formatElevationLabel}
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              cursor={{ stroke: "rgba(148,163,184,0.35)", strokeWidth: 1 }}
              content={<ProfileTooltip />}
            />
            <Line
              dataKey="climb"
              type="linear"
              stroke={TERRAIN_STYLE.climb.color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: TERRAIN_STYLE.climb.color }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="rolling"
              type="linear"
              stroke={TERRAIN_STYLE.rolling.color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: TERRAIN_STYLE.rolling.color }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="descent"
              type="linear"
              stroke={TERRAIN_STYLE.descent.color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: TERRAIN_STYLE.descent.color }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
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
  }));

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
    const segmentType = getTerrainCategory(gradePercent);

    chartData[index - 1][segmentType] = previousSample.elevation;
    chartData[index][segmentType] = currentSample.elevation;
    chartData[index].gradePercent = gradePercent;
    chartData[index].segmentType = segmentType;

    if (chartData[index - 1].segmentType === null) {
      chartData[index - 1].gradePercent = gradePercent;
      chartData[index - 1].segmentType = segmentType;
    }
  }

  return chartData;
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

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 text-sm text-white shadow-[0_18px_48px_rgba(15,23,42,0.32)]">
      <p className="font-semibold">{formatDistanceLabel(sample.distanceKm)}</p>
      <p className="mt-1 text-slate-300">
        Elevation: {formatElevationLabel(sample.elevation)}
      </p>
      {sample.gradePercent !== null ? (
        <p className="mt-1" style={{ color: terrain.color }}>
          {terrain.label}: {sample.gradePercent >= 0 ? "+" : ""}
          {sample.gradePercent.toFixed(1)}%
        </p>
      ) : null}
    </div>
  );
}

function formatDistanceLabel(distanceKm: number): string {
  return `${distanceKm.toFixed(distanceKm >= 10 ? 0 : 1)} km`;
}

function formatElevationLabel(elevationMeters: number): string {
  return `${Math.round(elevationMeters)} m`;
}
