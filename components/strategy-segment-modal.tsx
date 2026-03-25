"use client";

import { useEffect } from "react";
import { formatDistance } from "@/lib/format";
import { type ParsedGpxRoute } from "@/lib/gpx";
import {
  calculateRaceStrategyMetrics,
  type RaceStrategyDraft,
} from "@/lib/race-strategy";

export default function StrategySegmentModal({
  route,
  draft,
  onDraftChange,
  onSave,
  onClose,
  onDelete,
}: {
  route: ParsedGpxRoute;
  draft: RaceStrategyDraft;
  onDraftChange: (draft: RaceStrategyDraft) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const metrics = calculateRaceStrategyMetrics(
    route,
    draft.startDistanceMeters,
    draft.endDistanceMeters,
  );

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="print-hidden fixed inset-0 z-[5000] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close segment editor"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative max-h-full w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Segment details
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {draft.id ? "Update race-plan segment" : "Add race-plan segment"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {formatDistance(draft.startDistanceMeters)} to{" "}
              {formatDistance(draft.endDistanceMeters)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Distance"
            value={`${Math.round(metrics.distanceMeters)} m`}
          />
          <MetricTile
            label="Total D+"
            value={formatMetricElevation(metrics.totalAscentMeters)}
          />
          <MetricTile
            label="Total D-"
            value={formatMetricElevation(metrics.totalDescentMeters)}
          />
          <MetricTile
            label="Avg %"
            value={
              metrics.averageGradePercent === null
                ? "Unavailable"
                : formatGrade(metrics.averageGradePercent)
            }
          />
        </div>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-900">Title</span>
            <input
              type="text"
              value={draft.title}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  title: event.target.value,
                })
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
              placeholder="Example: Stay calm before the climb kicks up"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-900">Notes</span>
            <textarea
              value={draft.notes}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  notes: event.target.value,
                })
              }
              rows={6}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
              placeholder="Describe the race execution for this segment."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900">
                Pacing
              </span>
              <input
                type="text"
                value={draft.pacing}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    pacing: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                placeholder="Tempo / threshold"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-900">
                Nutrition
              </span>
              <input
                type="text"
                value={draft.nutrition}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    nutrition: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                placeholder="Drink, gel, caffeine"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-900">
                Target time
              </span>
              <input
                type="text"
                value={draft.targetTime}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    targetTime: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                placeholder="12:40"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
          >
            {draft.id ? "Save changes" : "Add segment"}
          </button>
          {draft.id ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50"
            >
              Delete segment
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-slate-950"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatMetricElevation(value: number | null): string {
  return value === null ? "Unavailable" : `${Math.round(value)} m`;
}

function formatGrade(gradePercent: number): string {
  return `${gradePercent >= 0 ? "+" : ""}${gradePercent.toFixed(1)}%`;
}
