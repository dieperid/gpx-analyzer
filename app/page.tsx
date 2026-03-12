"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
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

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loadedRoute, setLoadedRoute] = useState<LoadedRoute | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
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
          </div>

          <ElevationProfilePanel route={loadedRoute?.route ?? null} />
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

function formatDistance(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

function formatElevation(elevationMeters: number | null): string {
  if (elevationMeters === null) {
    return "Unavailable";
  }

  return `${Math.round(elevationMeters)} m`;
}

function ElevationProfilePanel({ route }: { route: ParsedGpxRoute | null }) {
  const startPoint = route?.points[0] ?? null;
  const endPoint = route?.points[route.points.length - 1] ?? null;

  return (
    <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white shadow-[0_18px_48px_rgba(15,23,42,0.14)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
        Elevation profile
      </p>

      {route ? (
        <div className="mt-5 space-y-5 text-sm leading-6 text-slate-200">
          <ProfileChart route={route} />
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

function ProfileChart({ route }: { route: ParsedGpxRoute }) {
  if (route.elevationProfile.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-10 text-center text-slate-300">
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
  const distanceRange = Math.max(route.totalDistanceMeters, 1);

  const points = route.elevationProfile
    .map((sample) => {
      const x = (sample.distanceMeters / distanceRange) * chartWidth;
      const y =
        chartHeight -
        ((sample.elevation - minElevation) / elevationRange) * chartHeight;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
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

      <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
        <span>{formatElevation(maxElevation)}</span>
        <span>{formatDistance(route.totalDistanceMeters)}</span>
        <span>{formatElevation(minElevation)}</span>
      </div>
    </div>
  );
}
