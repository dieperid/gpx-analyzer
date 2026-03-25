"use client";

import { useState } from "react";
import ElevationProfilePanel from "@/components/elevation-profile-panel";
import ProfileSegmentInsights from "@/components/profile-segment-insights";
import RaceStrategySection from "@/components/race-strategy-section";
import StrategySegmentModal from "@/components/strategy-segment-modal";
import RouteOverviewSection from "@/components/route-overview-section";
import { getTerrainSegments } from "@/lib/elevation-profile";
import { type ParsedGpxRoute } from "@/lib/gpx";
import {
  getRaceStrategySegmentsInOrder,
  normalizeStrategyRange,
  type RaceStrategyDraft,
  type RaceStrategySegment,
  type RaceStrategySelectionMode,
} from "@/lib/race-strategy";

export default function ProfileOverviewSection({
  route,
  fileName,
  strategySegments,
  onStrategySegmentsChange,
}: {
  route: ParsedGpxRoute | null;
  fileName: string | null;
  strategySegments: RaceStrategySegment[];
  onStrategySegmentsChange: (segments: RaceStrategySegment[]) => void;
}) {
  const [selectionMode, setSelectionMode] =
    useState<RaceStrategySelectionMode>("detected");
  const [draft, setDraft] = useState<RaceStrategyDraft | null>(null);
  const detectedSegments = route ? getTerrainSegments(route) : [];
  const orderedStrategySegments =
    getRaceStrategySegmentsInOrder(strategySegments);

  function handleDetectedSegmentSelect(segmentId: number) {
    if (!route) {
      return;
    }

    const segment = detectedSegments.find(
      (candidateSegment) => candidateSegment.id === segmentId,
    );

    if (!segment) {
      return;
    }

    const existingSegment = strategySegments.find(
      (candidateSegment) =>
        candidateSegment.source === "detected" &&
        candidateSegment.detectedSegmentId === segmentId,
    );

    setSelectionMode("detected");
    setDraft(
      existingSegment
        ? { ...existingSegment }
        : {
            id: null,
            title: buildDefaultTitle(
              segment.type === "climb"
                ? "Climb"
                : segment.type === "descent"
                  ? "Descent"
                  : "Segment",
              segment.startDistanceKm * 1000,
              segment.endDistanceKm * 1000,
            ),
            notes: "",
            pacing: "",
            nutrition: "",
            targetTime: "",
            startDistanceMeters: segment.startDistanceKm * 1000,
            endDistanceMeters: segment.endDistanceKm * 1000,
            source: "detected",
            detectedSegmentId: segmentId,
          },
    );
  }

  function handleCustomRangeSelect(
    startDistanceMeters: number,
    endDistanceMeters: number,
  ) {
    if (!route) {
      return;
    }

    const normalizedRange = normalizeStrategyRange(
      startDistanceMeters,
      endDistanceMeters,
      route.totalDistanceMeters,
    );
    const existingSegment = strategySegments.find(
      (segment) =>
        segment.source === "custom" &&
        Math.round(segment.startDistanceMeters) ===
          Math.round(normalizedRange.startDistanceMeters) &&
        Math.round(segment.endDistanceMeters) ===
          Math.round(normalizedRange.endDistanceMeters),
    );

    setSelectionMode("custom");
    setDraft(
      existingSegment
        ? { ...existingSegment }
        : {
            id: null,
            title: buildDefaultTitle(
              "Custom segment",
              normalizedRange.startDistanceMeters,
              normalizedRange.endDistanceMeters,
            ),
            notes: "",
            pacing: "",
            nutrition: "",
            targetTime: "",
            startDistanceMeters: normalizedRange.startDistanceMeters,
            endDistanceMeters: normalizedRange.endDistanceMeters,
            source: "custom",
            detectedSegmentId: null,
          },
    );
  }

  function handleSaveDraft() {
    if (!route || draft === null) {
      return;
    }

    const normalizedRange = normalizeStrategyRange(
      draft.startDistanceMeters,
      draft.endDistanceMeters,
      route.totalDistanceMeters,
    );
    const matchingSegment = strategySegments.find(
      (segment) =>
        segment.id !== draft.id &&
        segment.source === draft.source &&
        segment.detectedSegmentId === draft.detectedSegmentId &&
        Math.round(segment.startDistanceMeters) ===
          Math.round(normalizedRange.startDistanceMeters) &&
        Math.round(segment.endDistanceMeters) ===
          Math.round(normalizedRange.endDistanceMeters),
    );
    const nextSegment: RaceStrategySegment = {
      ...draft,
      ...normalizedRange,
      id: draft.id ?? matchingSegment?.id ?? crypto.randomUUID(),
      title:
        draft.title.trim() ||
        buildDefaultTitle(
          draft.source === "detected" ? "Detected segment" : "Custom segment",
          normalizedRange.startDistanceMeters,
          normalizedRange.endDistanceMeters,
        ),
      notes: draft.notes.trim(),
      pacing: draft.pacing.trim(),
      nutrition: draft.nutrition.trim(),
      targetTime: draft.targetTime.trim(),
    };

    const nextSegments = strategySegments.some(
      (segment) => segment.id === nextSegment.id,
    )
      ? strategySegments.map((segment) =>
          segment.id === nextSegment.id ? nextSegment : segment,
        )
      : [...strategySegments, nextSegment];

    onStrategySegmentsChange(nextSegments);
    setDraft(null);
  }

  function handleEditSegment(segmentId: string) {
    const strategySegment = strategySegments.find(
      (segment) => segment.id === segmentId,
    );

    if (!strategySegment) {
      return;
    }

    setSelectionMode(strategySegment.source);
    setDraft({ ...strategySegment });
  }

  function handleDeleteSegment(segmentId: string) {
    onStrategySegmentsChange(
      strategySegments.filter((segment) => segment.id !== segmentId),
    );

    if (draft?.id === segmentId) {
      setDraft(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            {route?.name ?? fileName ?? "Elevation profile and overview"}
          </h2>
        </div>
      </div>

      <ElevationProfilePanel
        route={route}
        embedded
        selectionMode={selectionMode}
        onSelectionModeChange={setSelectionMode}
        selectedRange={
          draft
            ? {
                startDistanceMeters: draft.startDistanceMeters,
                endDistanceMeters: draft.endDistanceMeters,
              }
            : null
        }
        strategySegments={orderedStrategySegments}
        onDetectedSegmentSelect={handleDetectedSegmentSelect}
        onCustomRangeSelect={handleCustomRangeSelect}
        onExportPdf={() => window.print()}
      />

      <div className="px-6 py-6">
        <div className="print-hidden">
          <RouteOverviewSection route={route} fileName={fileName} embedded />
        </div>
        <ProfileSegmentInsights route={route} />
        <RaceStrategySection
          route={route}
          strategySegments={orderedStrategySegments}
          onEditSegment={handleEditSegment}
          onDeleteSegment={handleDeleteSegment}
        />
      </div>

      {route && draft ? (
        <StrategySegmentModal
          route={route}
          draft={draft}
          onDraftChange={(nextDraft) => setDraft(nextDraft)}
          onSave={handleSaveDraft}
          onClose={() => setDraft(null)}
          onDelete={() => {
            if (draft.id) {
              handleDeleteSegment(draft.id);
              return;
            }

            setDraft(null);
          }}
        />
      ) : null}
    </section>
  );
}

function buildDefaultTitle(
  prefix: string,
  startDistanceMeters: number,
  endDistanceMeters: number,
): string {
  return `${prefix} ${formatDistanceValue(startDistanceMeters)}-${formatDistanceValue(
    endDistanceMeters,
  )}`;
}

function formatDistanceValue(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}
