"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import RouteMap from "@/components/route-map";
import {
  EmptyGpxError,
  InvalidGpxError,
  NoUsableTrackError,
  parseGpx,
  type ParsedGpxRoute,
} from "@/lib/gpx";

type LoadedRoute = {
  fileName: string;
  route: ParsedGpxRoute;
};

type TargetTimeInput = {
  hours: string;
  minutes: string;
  seconds: string;
};

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loadedRoute, setLoadedRoute] = useState<LoadedRoute | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [targetTimeInput, setTargetTimeInput] = useState<TargetTimeInput>({
    hours: "",
    minutes: "",
    seconds: "",
  });
  const targetTime = parseTargetTimeInput(targetTimeInput);

  async function handleFileSelection(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setLoadedRoute(null);
      setErrorMessage("Please select a file with the .gpx extension.");
      return;
    }

    setLoadedRoute(null);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const content = await file.text();
      const route = parseGpx(content);

      setLoadedRoute({
        fileName: file.name,
        route,
      });
    } catch (error) {
      if (
        error instanceof EmptyGpxError ||
        error instanceof InvalidGpxError ||
        error instanceof NoUsableTrackError
      ) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "The file could not be read. Please try another GPX file.",
        );
      }
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFileSelection(event.target.files?.[0] ?? null);
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFileSelection(event.dataTransfer.files?.[0] ?? null);
  }

  function onTargetTimeFieldChange(
    field: keyof TargetTimeInput,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    const maxLength = field === "hours" ? 3 : 2;

    setTargetTimeInput((currentValue) => ({
      ...currentValue,
      [field]: digitsOnly.slice(0, maxLength),
    }));
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.24),transparent_28%),linear-gradient(180deg,#fffaf0_0%,#f8fafc_45%,#eef2ff_100%)] px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-4xl border border-white/70 bg-white/75 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                GPX Analyzer
              </div>

              <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <InfoCard label="Read mode" value="client-side" />
                <InfoCard label="Main track" value="selected" />
                <InfoCard label="Segments" value="merged" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`group relative flex min-h-[320px] flex-col items-start justify-between rounded-[28px] border p-6 text-left transition ${
                isDragging
                  ? "border-sky-500 bg-sky-50 shadow-[0_20px_50px_rgba(14,165,233,0.18)]"
                  : "border-slate-200 bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)]"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".gpx,application/gpx+xml"
                className="hidden"
                onChange={onInputChange}
              />

              <div className="space-y-3">
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
                    isDragging
                      ? "bg-sky-100 text-sky-700"
                      : "bg-white/10 text-slate-200"
                  }`}
                >
                  {isLoading ? "Loading" : "Import"}
                </div>
                <h2
                  className={`text-2xl font-semibold tracking-tight ${
                    isDragging ? "text-slate-950" : "text-white"
                  }`}
                >
                  {isDragging ? "Drop your GPX file here" : "Choose a GPX file"}
                </h2>
              </div>

              <div
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                  isDragging
                    ? "border-sky-200 bg-white text-slate-700"
                    : "border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                <span>{isLoading ? "Parsing route..." : "Select file"}</span>
                <span className="font-medium">
                  {loadedRoute ? loadedRoute.fileName : "No file loaded"}
                </span>
              </div>
            </button>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-5 text-rose-900 shadow-[0_18px_40px_rgba(244,63,94,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em]">
              Import error
            </p>
            <p className="mt-2 text-base">{errorMessage}</p>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Loaded route
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {loadedRoute?.route.name ??
                  loadedRoute?.fileName ??
                  "Waiting for import"}
              </h2>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              {loadedRoute ? "Ready" : "Idle"}
            </div>
          </div>

          {loadedRoute ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                label="Main track"
                value={`#${loadedRoute.route.sourceTrackIndex + 1}`}
              />
              <MetricCard
                label="Tracks"
                value={loadedRoute.route.trackCount.toLocaleString()}
              />
              <MetricCard
                label="Segments"
                value={loadedRoute.route.segmentCount.toLocaleString()}
              />
              <MetricCard
                label="Track points"
                value={loadedRoute.route.points.length.toLocaleString()}
              />
              <MetricCard
                label="Distance"
                value={formatDistance(loadedRoute.route.totalDistanceMeters)}
              />
              <MetricCard
                label="Elevation samples"
                value={loadedRoute.route.elevationPointCount.toLocaleString()}
              />
              <MetricCard
                label="Total ascent"
                value={formatElevation(loadedRoute.route.totalAscentMeters)}
              />
              <MetricCard
                label="Total descent"
                value={formatElevation(loadedRoute.route.totalDescentMeters)}
              />
              <MetricCard
                label="Ignored points"
                value={loadedRoute.route.ignoredPointCount.toLocaleString()}
              />
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
              Import a file to confirm that the GPX content is read correctly.
              Once parsed, the extracted tracks, segments, points, and total
              distance will appear here automatically.
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Target time
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  Define your total goal
                </h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                {targetTime.status === "valid" ? "Ready" : "Waiting"}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <TimeField
                label="Hours"
                placeholder="00"
                value={targetTimeInput.hours}
                onChange={(event) => onTargetTimeFieldChange("hours", event)}
              />
              <TimeField
                label="Minutes"
                placeholder="00"
                value={targetTimeInput.minutes}
                onChange={(event) => onTargetTimeFieldChange("minutes", event)}
              />
              <TimeField
                label="Seconds"
                placeholder="00"
                value={targetTimeInput.seconds}
                onChange={(event) => onTargetTimeFieldChange("seconds", event)}
              />
            </div>

            {targetTime.status === "invalid" ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {targetTime.errorMessage}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Enter `hours`, `minutes`, and `seconds`. Minutes and seconds must
                stay between `00` and `59`.
              </p>
            )}
          </div>

          <TargetTimeSummary
            route={loadedRoute?.route ?? null}
            targetTime={targetTime}
          />
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Route visualization
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {loadedRoute?.route.name ??
                  loadedRoute?.fileName ??
                  "Map and profile"}
              </h2>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              {loadedRoute ? "Auto-fit enabled" : "Awaiting import"}
            </div>
          </div>

          {loadedRoute ? (
            <>
              <RouteMap route={loadedRoute.route} embedded />
              <div className="overflow-hidden rounded-b-[28px] border-t border-slate-100 bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)]">
                <ElevationProfilePanel route={loadedRoute.route} embedded />
              </div>
            </>
          ) : (
            <div className="flex h-[620px] items-center justify-center bg-slate-50 px-6 text-sm text-slate-500">
              Import a GPX file to display the route map and elevation profile.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function TimeField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <input
        inputMode="numeric"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-3 w-full border-0 bg-transparent p-0 text-4xl font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-300"
      />
    </label>
  );
}

function formatDistance(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

function formatElevation(elevationMeters: number | null): string {
  if (elevationMeters === null) {
    return "Unavailable";
  }

  return `${Math.round(elevationMeters)} m`;
}

function ElevationProfilePanel({
  route,
  embedded = false,
}: {
  route: ParsedGpxRoute | null;
  embedded?: boolean;
}) {
  const startPoint = route?.points[0] ?? null;
  const endPoint = route?.points[route.points.length - 1] ?? null;

  return (
    <div
      className={
        embedded
          ? "p-6 text-white"
          : "rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white shadow-[0_18px_48px_rgba(15,23,42,0.14)]"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
        Elevation profile
      </p>

      {route ? (
        <div className="mt-5 space-y-5 text-sm leading-6 text-slate-200">
          <ProfileChart route={route} fullBleed={embedded} />
          <DetailRow
            label="Segment lengths"
            value={route.segments
              .map(
                (segment) =>
                  `#${segment.index + 1}: ${segment.points.length} pts / ${formatDistance(segment.totalDistanceMeters)}`,
              )
              .join(" | ")}
          />
          <DetailRow
            label="Start coordinate"
            value={startPoint ? formatCoordinate(startPoint) : "Unavailable"}
          />
          <DetailRow
            label="End coordinate"
            value={endPoint ? formatCoordinate(endPoint) : "Unavailable"}
          />
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-slate-300">
          After import, the route profile will appear here with chart-ready
          distance/elevation data and ordered track details.
        </p>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white">{value}</p>
    </div>
  );
}

function formatCoordinate(point: ParsedGpxRoute["points"][number]): string {
  return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
}

function TargetTimeSummary({
  route,
  targetTime,
}: {
  route: ParsedGpxRoute | null;
  targetTime: ParsedTargetTime;
}) {
  const hasRoute = route !== null;
  const pacePerKmSeconds =
    hasRoute && targetTime.status === "valid"
      ? targetTime.totalSeconds / Math.max(route.totalDistanceMeters / 1000, 0.001)
      : null;
  const averageSpeedKmh =
    hasRoute && targetTime.status === "valid"
      ? (route.totalDistanceMeters / 1000) / (targetTime.totalSeconds / 3600)
      : null;

  return (
    <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white shadow-[0_18px_48px_rgba(15,23,42,0.14)]">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
            Live conversion
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Target time output
          </h2>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
          {targetTime.status === "valid" ? "Live" : "Incomplete"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DarkMetricCard
          label="Formatted time"
          value={
            targetTime.status === "valid"
              ? formatDuration(targetTime.totalSeconds)
              : "--:--:--"
          }
        />
        <DarkMetricCard
          label="Usable seconds"
          value={
            targetTime.status === "valid"
              ? targetTime.totalSeconds.toLocaleString()
              : "0"
          }
        />
        <DarkMetricCard
          label="Average pace"
          value={pacePerKmSeconds !== null ? formatPace(pacePerKmSeconds) : "-- /km"}
        />
        <DarkMetricCard
          label="Average speed"
          value={
            averageSpeedKmh !== null ? `${averageSpeedKmh.toFixed(2)} km/h` : "-- km/h"
          }
        />
      </div>

      {!hasRoute ? (
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Import a route to convert the target time into route-based calculations.
        </p>
      ) : null}
    </div>
  );
}

function DarkMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function ProfileChart({
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
        Elevation data is missing or too sparse to draw a profile.
      </div>
    );
  }

  const chartWidth = 640;
  const chartHeight = 200;
  const elevations = route.elevationProfile.map((sample) => sample.elevation);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationRange = Math.max(maxElevation - minElevation, 1);
  const profileStartDistance = route.elevationProfile[0].distanceMeters;
  const profileEndDistance =
    route.elevationProfile[route.elevationProfile.length - 1].distanceMeters;
  const distanceRange = Math.max(profileEndDistance - profileStartDistance, 1);

  const points = route.elevationProfile
    .map((sample) => {
      const x =
        ((sample.distanceMeters - profileStartDistance) / distanceRange) *
        chartWidth;
      const y =
        chartHeight -
        ((sample.elevation - minElevation) / elevationRange) * chartHeight;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div
      className={`border-white/10 bg-white/5 ${
        fullBleed ? "border-y py-4 rounded-2xl" : "rounded-2xl border p-4"
      }`}
    >
      <div
        className={`mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-sky-200 ${
          fullBleed ? "px-6" : ""
        }`}
      >
        <span>Profile</span>
        <span>{route.elevationPointCount} samples</span>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-52 w-full overflow-visible"
        role="img"
        aria-label="Elevation profile chart"
      >
        <polyline
          fill="none"
          stroke="rgba(125, 211, 252, 0.95)"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>

      <div
        className={`mt-3 flex items-center justify-between text-xs text-slate-300 ${
          fullBleed ? "px-6" : ""
        }`}
      >
        <span>{formatElevation(maxElevation)}</span>
        <span>{formatDistance(route.totalDistanceMeters)}</span>
        <span>{formatElevation(minElevation)}</span>
      </div>
    </div>
  );
}

type ParsedTargetTime =
  | {
      status: "empty";
      errorMessage: null;
      totalSeconds: null;
    }
  | {
      status: "invalid";
      errorMessage: string;
      totalSeconds: null;
    }
  | {
      status: "valid";
      errorMessage: null;
      totalSeconds: number;
    };

function parseTargetTimeInput(input: TargetTimeInput): ParsedTargetTime {
  const hasAnyValue = Object.values(input).some((value) => value.length > 0);

  if (!hasAnyValue) {
    return {
      status: "empty",
      errorMessage: null,
      totalSeconds: null,
    };
  }

  const hours = input.hours === "" ? 0 : Number.parseInt(input.hours, 10);
  const minutes = input.minutes === "" ? 0 : Number.parseInt(input.minutes, 10);
  const seconds = input.seconds === "" ? 0 : Number.parseInt(input.seconds, 10);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || !Number.isInteger(seconds)) {
    return {
      status: "invalid",
      errorMessage: "Only numeric values are allowed for the target time.",
      totalSeconds: null,
    };
  }

  if (minutes > 59 || seconds > 59) {
    return {
      status: "invalid",
      errorMessage: "Minutes and seconds must stay between 00 and 59.",
      totalSeconds: null,
    };
  }

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  if (totalSeconds <= 0) {
    return {
      status: "invalid",
      errorMessage: "Enter a target time greater than zero.",
      totalSeconds: null,
    };
  }

  return {
    status: "valid",
    errorMessage: null,
    totalSeconds,
  };
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function formatPace(secondsPerKilometer: number): string {
  if (!Number.isFinite(secondsPerKilometer) || secondsPerKilometer <= 0) {
    return "-- /km";
  }

  const totalSeconds = Math.round(secondsPerKilometer);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}
