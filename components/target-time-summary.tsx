import { type ParsedGpxRoute } from "@/lib/gpx";
import { formatDistance, formatDuration, formatPace } from "@/lib/format";
import { type ParsedTargetTime } from "@/lib/target-time";

export default function TargetTimeSummary({
  route,
  targetTime,
}: {
  route: ParsedGpxRoute | null;
  targetTime: ParsedTargetTime;
}) {
  const hasRoute = route !== null;
  const pacePerKmSeconds =
    hasRoute && targetTime.status === "valid"
      ? targetTime.totalSeconds /
        Math.max(route.totalDistanceMeters / 1000, 0.001)
      : null;
  const averageSpeedKmh =
    hasRoute && targetTime.status === "valid"
      ? route.totalDistanceMeters / 1000 / (targetTime.totalSeconds / 3600)
      : null;

  return (
    <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white shadow-[0_18px_48px_rgba(15,23,42,0.14)]">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
            Global indicators
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Route and goal summary
          </h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DarkMetricCard
          label="Total distance"
          value={hasRoute ? formatDistance(route.totalDistanceMeters) : "-- km"}
        />
        <DarkMetricCard
          label="Target time"
          value={
            targetTime.status === "valid"
              ? formatDuration(targetTime.totalSeconds)
              : "--:--:--"
          }
        />
        <DarkMetricCard
          label="Average pace"
          value={
            pacePerKmSeconds !== null ? formatPace(pacePerKmSeconds) : "-- /km"
          }
        />
        <DarkMetricCard
          label="Average speed"
          value={
            averageSpeedKmh !== null
              ? `${averageSpeedKmh.toFixed(2)} km/h`
              : "-- km/h"
          }
        />
      </div>

      {!hasRoute ? (
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Import a route to convert the target time into route-based
          calculations.
        </p>
      ) : targetTime.status === "empty" ? (
        <p className="mt-4 text-sm leading-6 text-slate-300">
          A target time is still missing. Enter hours, minutes, and seconds to
          generate the global indicators.
        </p>
      ) : targetTime.status !== "valid" ? (
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Enter a valid target time to calculate the theoretical average pace
          and keep the summary indicators in sync.
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
