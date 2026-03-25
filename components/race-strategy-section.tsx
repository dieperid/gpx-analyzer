import { formatDistance, formatElevation } from "@/lib/format";
import { type ParsedGpxRoute } from "@/lib/gpx";
import {
  calculateRaceStrategyMetrics,
  getRaceStrategySegmentsInOrder,
  type RaceStrategySegment,
} from "@/lib/race-strategy";

export default function RaceStrategySection({
  route,
  strategySegments,
  onEditSegment,
  onDeleteSegment,
}: {
  route: ParsedGpxRoute | null;
  strategySegments: RaceStrategySegment[];
  onEditSegment: (segmentId: string) => void;
  onDeleteSegment: (segmentId: string) => void;
}) {
  if (!route) {
    return null;
  }

  const orderedSegments = getRaceStrategySegmentsInOrder(strategySegments);

  return (
    <section className="border-t border-slate-100 pt-6">
      <div className="print-hidden flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Segment list
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            Saved race-plan segments
          </h3>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {orderedSegments.length > 0 ? (
          orderedSegments.map((segment, index) => {
            const metrics = calculateRaceStrategyMetrics(
              route,
              segment.startDistanceMeters,
              segment.endDistanceMeters,
            );

            return (
              <article
                key={segment.id}
                className="page-break-avoid rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                      Segment {index + 1}
                    </div>
                    <h4 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                      {segment.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {formatDistance(segment.startDistanceMeters)} to{" "}
                      {formatDistance(segment.endDistanceMeters)}
                    </p>
                  </div>

                  <div className="print-hidden flex gap-3">
                    <button
                      type="button"
                      onClick={() => onEditSegment(segment.id)}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-slate-950"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSegment(segment.id)}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricPill
                    label="Distance"
                    value={`${Math.round(metrics.distanceMeters)} m`}
                  />
                  <MetricPill
                    label="Total D+"
                    value={formatElevation(metrics.totalAscentMeters)}
                  />
                  <MetricPill
                    label="Total D-"
                    value={formatElevation(metrics.totalDescentMeters)}
                  />
                  <MetricPill
                    label="Avg %"
                    value={
                      metrics.averageGradePercent === null
                        ? "Unavailable"
                        : formatGrade(metrics.averageGradePercent)
                    }
                  />
                  <MetricPill
                    label="Max %"
                    value={
                      metrics.maxGradePercent === null
                        ? "Unavailable"
                        : formatGrade(metrics.maxGradePercent)
                    }
                  />
                  <MetricPill
                    label="Source"
                    value={
                      segment.source === "detected"
                        ? "Detected segment"
                        : "Custom segment"
                    }
                  />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <StrategyField label="Pacing" value={segment.pacing} />
                  <StrategyField label="Nutrition" value={segment.nutrition} />
                  <StrategyField
                    label="Target time"
                    value={segment.targetTime}
                  />
                </div>

                <div className="mt-5 rounded-[24px] bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Notes
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {segment.notes || "No notes added yet."}
                  </p>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-5 py-8 text-sm leading-6 text-slate-600">
            No saved segments yet. Click a detected profile segment or draw a
            custom range on the chart to open the editor.
          </div>
        )}
      </div>
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StrategyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {value || "Not specified"}
      </p>
    </div>
  );
}

function formatGrade(gradePercent: number): string {
  return `${gradePercent >= 0 ? "+" : ""}${gradePercent.toFixed(1)}%`;
}
