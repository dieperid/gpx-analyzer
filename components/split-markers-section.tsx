import { type ParsedGpxRoute } from "@/lib/gpx";
import { formatDistance, formatDuration, formatElevation } from "@/lib/format";
import { type SplitMarker } from "@/lib/splits";
import { type ParsedTargetTime } from "@/lib/target-time";
import MetricCard from "@/components/ui/metric-card";

export default function SplitMarkersSection({
  route,
  targetTime,
  splitMarkers,
}: {
  route: ParsedGpxRoute | null;
  targetTime: ParsedTargetTime;
  splitMarkers: SplitMarker[];
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Split markers
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Intermediate split times
          </h2>
        </div>
      </div>

      {!route ? (
        <p className="mt-6 text-sm leading-6 text-slate-600">
          Import a route to generate kilometer markers and the finish marker.
        </p>
      ) : targetTime.status === "empty" ? (
        <p className="mt-6 text-sm leading-6 text-slate-600">
          Enter a target time to calculate split times for each kilometer
          marker.
        </p>
      ) : targetTime.status !== "valid" ? (
        <p className="mt-6 text-sm leading-6 text-slate-600">
          Enter a valid target time to calculate split times proportional to the
          cumulative distance.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Last split"
              value={splitMarkers[splitMarkers.length - 1]?.label ?? "Finish"}
            />
            <MetricCard
              label="Final distance"
              value={formatDistance(
                splitMarkers[splitMarkers.length - 1]
                  ?.cumulativeDistanceMeters ?? route.totalDistanceMeters,
              )}
            />
            <MetricCard
              label="Final time"
              value={formatDuration(
                splitMarkers[splitMarkers.length - 1]?.estimatedTimeSeconds ??
                  targetTime.totalSeconds,
              )}
            />
          </div>

          <div className="mt-6 space-y-4 lg:hidden">
            {splitMarkers.map((marker) => (
              <div
                key={`${marker.kind}-${marker.label}-${marker.cumulativeDistanceMeters}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-semibold text-slate-950">
                    {marker.label}
                  </span>
                  <span className="text-sm text-slate-500">
                    {formatDistance(marker.cumulativeDistanceMeters)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <MobileStat
                    label="Time"
                    value={formatDuration(marker.estimatedTimeSeconds)}
                  />
                  <MobileStat
                    label="Gain"
                    value={formatElevation(marker.elevationGainMeters)}
                  />
                  <MobileStat
                    label="Loss"
                    value={formatElevation(marker.elevationLossMeters)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
            <div className="overflow-x-auto">
              <div className="min-w-215">
                <div className="grid grid-cols-5 gap-4 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Marker</span>
                  <span>Distance</span>
                  <span>Estimated time</span>
                  <span>Gain</span>
                  <span>Loss</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {splitMarkers.map((marker) => (
                    <div
                      key={`${marker.kind}-${marker.label}-${marker.cumulativeDistanceMeters}`}
                      className="grid grid-cols-5 gap-4 px-5 py-4 text-sm text-slate-700"
                    >
                      <span className="font-semibold text-slate-950">
                        {marker.label}
                      </span>
                      <span>
                        {formatDistance(marker.cumulativeDistanceMeters)}
                      </span>
                      <span>{formatDuration(marker.estimatedTimeSeconds)}</span>
                      <span>{formatElevation(marker.elevationGainMeters)}</span>
                      <span>{formatElevation(marker.elevationLossMeters)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/0 bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}
