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
import { type ParsedGpxRoute } from "@/lib/gpx";
import {
  buildProfileChartData,
  getElevationTicks,
  type ProfileChartDatum,
  TERRAIN_STYLE,
} from "@/lib/elevation-profile";

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
        className={`border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-slate-500 ${
          fullBleed ? "border-x-0 border-y" : "rounded-2xl"
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
        className={`mt-3 flex items-center justify-between text-xs ${
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
            Distance: {formatDistanceMetersLabel(activeSegment.distanceKm * 1000)}
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
