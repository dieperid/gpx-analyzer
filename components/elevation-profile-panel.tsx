import ElevationProfileChart from "@/components/elevation-profile-chart";
import { type ParsedGpxRoute } from "@/lib/gpx";
import {
  type RaceStrategySegment,
  type RaceStrategySelectionMode,
} from "@/lib/race-strategy";

export default function ElevationProfilePanel({
  route,
  embedded = false,
  selectionMode = "detected",
  selectedRange = null,
  strategySegments = [],
  onSelectionModeChange,
  onDetectedSegmentSelect,
  onCustomRangeSelect,
  onExportPdf,
}: {
  route: ParsedGpxRoute | null;
  embedded?: boolean;
  selectionMode?: RaceStrategySelectionMode;
  selectedRange?: {
    startDistanceMeters: number;
    endDistanceMeters: number;
  } | null;
  strategySegments?: RaceStrategySegment[];
  onSelectionModeChange?: (mode: RaceStrategySelectionMode) => void;
  onDetectedSegmentSelect?: (segmentId: number) => void;
  onCustomRangeSelect?: (
    startDistanceMeters: number,
    endDistanceMeters: number,
  ) => void;
  onExportPdf?: () => void;
}) {
  return (
    <div
      className={
        embedded
          ? "p-6 text-slate-950"
          : "rounded-[28px] border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        Elevation profile
      </p>

      {route ? (
        <div className="mt-5 space-y-5 text-sm leading-6 text-slate-600">
          <div className="print-hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onSelectionModeChange?.("detected")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectionMode === "detected"
                    ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-950"
                }`}
              >
                Click detected segment
              </button>
              <button
                type="button"
                onClick={() => onSelectionModeChange?.("custom")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectionMode === "custom"
                    ? "bg-amber-500 text-slate-950 shadow-[0_10px_24px_rgba(245,158,11,0.2)]"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-950"
                }`}
              >
                Draw custom segment
              </button>
            </div>

            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
            >
              Export PDF
            </button>
          </div>

          <ElevationProfileChart
            route={route}
            fullBleed={embedded}
            selectionMode={selectionMode}
            selectedRange={selectedRange}
            strategySegments={strategySegments}
            onDetectedSegmentSelect={onDetectedSegmentSelect}
            onCustomRangeSelect={onCustomRangeSelect}
          />
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-slate-600">
          After import, the route profile will appear here with chart-ready
          distance/elevation data and ordered track details.
        </p>
      )}
    </div>
  );
}
