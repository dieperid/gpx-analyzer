"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import ProfileOverviewSection from "@/components/profile-overview-section";
import RouteMapSection from "@/components/route-map-section";
import SplitMarkersSection from "@/components/split-markers-section";
import TargetTimeSection from "@/components/target-time-section";
import TargetTimeSummary from "@/components/target-time-summary";
import {
  EmptyGpxError,
  InvalidGpxError,
  NoTrackDetectedError,
  NoUsableTrackError,
  parseGpx,
  type ParsedGpxRoute,
} from "@/lib/gpx";
import { buildSplitMarkers } from "@/lib/splits";
import { parseTargetTimeInput, type TargetTimeInput } from "@/lib/target-time";

type LoadedRoute = {
  fileName: string;
  importId: string;
  route: ParsedGpxRoute;
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
  const activeRoute = loadedRoute?.route ?? null;
  const targetTime = parseTargetTimeInput(targetTimeInput);
  const splitMarkers =
    activeRoute !== null && targetTime.status === "valid"
      ? buildSplitMarkers(activeRoute, targetTime.totalSeconds)
      : [];

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
    setIsDragging(false);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const content = await file.text();
      const route = parseGpx(content);

      setLoadedRoute({
        fileName: file.name,
        importId: crypto.randomUUID(),
        route,
      });
    } catch (error) {
      if (
        error instanceof EmptyGpxError ||
        error instanceof InvalidGpxError ||
        error instanceof NoTrackDetectedError ||
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
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              GPX Analyzer
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
              className={`group relative flex w-full flex-col items-start justify-between space-y-4 rounded-[28px] border p-6 text-left transition ${
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

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {errorMessage}
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <TargetTimeSection
            value={targetTimeInput}
            targetTime={targetTime}
            onFieldChange={onTargetTimeFieldChange}
          />
          <TargetTimeSummary route={activeRoute} targetTime={targetTime} />
        </section>

        <SplitMarkersSection
          route={activeRoute}
          targetTime={targetTime}
          splitMarkers={splitMarkers}
        />

        <RouteMapSection
          route={activeRoute}
          fileName={loadedRoute?.fileName ?? null}
          importId={loadedRoute?.importId ?? null}
        />

        <ProfileOverviewSection
          route={activeRoute}
          fileName={loadedRoute?.fileName ?? null}
        />
      </div>
    </main>
  );
}
