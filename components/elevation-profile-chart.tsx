"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  type RaceStrategySegment,
  type RaceStrategySelectionMode,
} from "@/lib/race-strategy";

const PLOT_LEFT_GUTTER_PX = 56;
const PLOT_RIGHT_GUTTER_PX = 14;
const PLOT_TOP_GUTTER_PX = 10;
const PLOT_BOTTOM_GUTTER_PX = 24;
const MIN_CUSTOM_SELECTION_DISTANCE_METERS = 25;

export default function ElevationProfileChart({
  route,
  fullBleed = false,
  selectionMode = "detected",
  selectedRange = null,
  strategySegments = [],
  onDetectedSegmentSelect,
  onCustomRangeSelect,
}: {
  route: ParsedGpxRoute;
  fullBleed?: boolean;
  selectionMode?: RaceStrategySelectionMode;
  selectedRange?: {
    startDistanceMeters: number;
    endDistanceMeters: number;
  } | null;
  strategySegments?: RaceStrategySegment[];
  onDetectedSegmentSelect?: (segmentId: number) => void;
  onCustomRangeSelect?: (
    startDistanceMeters: number,
    endDistanceMeters: number,
  ) => void;
}) {
  const plotAreaRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(0);
  const [dragRange, setDragRange] = useState<{
    startDistanceMeters: number;
    endDistanceMeters: number;
  } | null>(null);

  useEffect(() => {
    const plotArea = plotAreaRef.current;

    if (!plotArea) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      setPlotWidth(plotArea.getBoundingClientRect().width);
    });

    setPlotWidth(plotArea.getBoundingClientRect().width);
    resizeObserver.observe(plotArea);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
  const activeRange = dragRange ?? selectedRange;

  return (
    <div
      className={`border-slate-200 bg-slate-50 ${
        fullBleed ? "rounded-2xl border-y px-0 py-4" : "rounded-2xl border p-4"
      }`}
    >
      <div
        className={`relative h-56 w-full ${fullBleed ? "pr-3" : ""}`}
        role="img"
        aria-label="Elevation profile chart"
        onClick={(event) => {
          if (selectionMode !== "detected") {
            return;
          }

          const distanceMeters = getDistanceFromPointer(
            event.clientX,
            plotAreaRef.current,
            route.totalDistanceMeters,
          );

          if (distanceMeters === null) {
            return;
          }

          const segmentId = getDetectedSegmentIdFromDistance(
            chartData,
            distanceMeters,
          );

          if (segmentId !== null) {
            onDetectedSegmentSelect?.(segmentId);
          }
        }}
      >
        <div className="relative z-20 h-full w-full">
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
              <Tooltip content={<ProfileTooltip />} />
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
          ref={plotAreaRef}
          className="pointer-events-none absolute z-10"
          style={{
            left: `${PLOT_LEFT_GUTTER_PX}px`,
            right: `${PLOT_RIGHT_GUTTER_PX}px`,
            top: `${PLOT_TOP_GUTTER_PX}px`,
            bottom: `${PLOT_BOTTOM_GUTTER_PX}px`,
          }}
        >
          {strategySegments.map((segment, index) => (
            <StrategySegmentOverlay
              key={segment.id}
              segment={segment}
              index={index}
              totalDistanceMeters={route.totalDistanceMeters}
              plotWidth={plotWidth}
            />
          ))}

          {activeRange ? (
            <SelectedRangeOverlay
              startDistanceMeters={activeRange.startDistanceMeters}
              endDistanceMeters={activeRange.endDistanceMeters}
              totalDistanceMeters={route.totalDistanceMeters}
            />
          ) : null}
        </div>

        {selectionMode === "custom" ? (
          <div
            className="absolute z-30 cursor-crosshair"
            style={{
              left: `${PLOT_LEFT_GUTTER_PX}px`,
              right: `${PLOT_RIGHT_GUTTER_PX}px`,
              top: `${PLOT_TOP_GUTTER_PX}px`,
              bottom: `${PLOT_BOTTOM_GUTTER_PX}px`,
            }}
            onPointerDown={(event) => {
              const startDistanceMeters = getDistanceFromPointer(
                event.clientX,
                plotAreaRef.current,
                route.totalDistanceMeters,
              );

              if (startDistanceMeters === null) {
                return;
              }

              event.currentTarget.setPointerCapture(event.pointerId);
              setDragRange({
                startDistanceMeters,
                endDistanceMeters: startDistanceMeters,
              });
            }}
            onPointerMove={(event) => {
              if (dragRange === null) {
                return;
              }

              const endDistanceMeters = getDistanceFromPointer(
                event.clientX,
                plotAreaRef.current,
                route.totalDistanceMeters,
              );

              if (endDistanceMeters === null) {
                return;
              }

              setDragRange((currentRange) =>
                currentRange === null
                  ? null
                  : {
                      ...currentRange,
                      endDistanceMeters,
                    },
              );
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);

              if (dragRange === null) {
                return;
              }

              const normalizedRange = normalizeRange(
                dragRange.startDistanceMeters,
                dragRange.endDistanceMeters,
              );

              setDragRange(null);

              if (
                normalizedRange.endDistanceMeters -
                  normalizedRange.startDistanceMeters <
                MIN_CUSTOM_SELECTION_DISTANCE_METERS
              ) {
                return;
              }

              onCustomRangeSelect?.(
                normalizedRange.startDistanceMeters,
                normalizedRange.endDistanceMeters,
              );
            }}
          />
        ) : null}
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
            Segment range: {activeSegment.startDistanceKm.toFixed(2)} –{" "}
            {activeSegment.endDistanceKm.toFixed(2)} km
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
            <p>Distance: {sample.distanceKm.toFixed(1)} km</p>
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
            <p>Distance: {sample.distanceKm.toFixed(2)} km</p>
            <p>Elevation: {formatElevationLabel(sample.elevation)}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StrategySegmentOverlay({
  segment,
  index,
  totalDistanceMeters,
  plotWidth,
}: {
  segment: RaceStrategySegment;
  index: number;
  totalDistanceMeters: number;
  plotWidth: number;
}) {
  const normalizedRange = normalizeRange(
    segment.startDistanceMeters,
    segment.endDistanceMeters,
  );
  const leftPercent =
    (normalizedRange.startDistanceMeters / totalDistanceMeters) * 100;
  const widthPercent = Math.max(
    ((normalizedRange.endDistanceMeters - normalizedRange.startDistanceMeters) /
      totalDistanceMeters) *
      100,
    plotWidth > 0 ? (26 / plotWidth) * 100 : 0,
  );

  return (
    <div
      className="absolute bottom-6 top-5 rounded-xl border border-amber-500/50 bg-amber-300/18"
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      }}
    >
      <div className="absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
        {index + 1}. {segment.title}
      </div>
    </div>
  );
}

function SelectedRangeOverlay({
  startDistanceMeters,
  endDistanceMeters,
  totalDistanceMeters,
}: {
  startDistanceMeters: number;
  endDistanceMeters: number;
  totalDistanceMeters: number;
}) {
  const normalizedRange = normalizeRange(
    startDistanceMeters,
    endDistanceMeters,
  );
  const leftPercent =
    (normalizedRange.startDistanceMeters / totalDistanceMeters) * 100;
  const widthPercent =
    ((normalizedRange.endDistanceMeters - normalizedRange.startDistanceMeters) /
      totalDistanceMeters) *
    100;

  return (
    <div
      className="absolute inset-y-2 rounded-xl border-2 border-dashed border-amber-500 bg-amber-300/12"
      style={{
        left: `${leftPercent}%`,
        width: `${Math.max(widthPercent, 0.5)}%`,
      }}
    />
  );
}

function getDistanceFromPointer(
  clientX: number,
  plotArea: HTMLDivElement | null,
  totalDistanceMeters: number,
): number | null {
  if (!plotArea) {
    return null;
  }

  const bounds = plotArea.getBoundingClientRect();
  const relativeX = clamp((clientX - bounds.left) / bounds.width, 0, 1);

  return relativeX * totalDistanceMeters;
}

function getDetectedSegmentIdFromDistance(
  chartData: ProfileChartDatum[],
  distanceMeters: number,
): number | null {
  let closestSample: ProfileChartDatum | null = null;
  let closestDistanceDelta = Number.POSITIVE_INFINITY;

  for (const sample of chartData) {
    const distanceDelta = Math.abs(sample.distanceKm * 1000 - distanceMeters);

    if (distanceDelta < closestDistanceDelta) {
      closestSample = sample;
      closestDistanceDelta = distanceDelta;
    }
  }

  return closestSample?.segment?.id ?? null;
}

function normalizeRange(
  startDistanceMeters: number,
  endDistanceMeters: number,
): {
  startDistanceMeters: number;
  endDistanceMeters: number;
} {
  return startDistanceMeters <= endDistanceMeters
    ? {
        startDistanceMeters,
        endDistanceMeters,
      }
    : {
        startDistanceMeters: endDistanceMeters,
        endDistanceMeters: startDistanceMeters,
      };
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value));
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
