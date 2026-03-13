import { type ParsedGpxRoute } from "@/lib/gpx";
import { formatDistance, formatElevation } from "@/lib/format";
import {
  calculateAscentRatioPerKm,
  calculateWeightedAverageSlope,
} from "@/lib/route-metrics";
import MetricCard from "@/components/ui/metric-card";

export default function RouteOverviewSection({
  route,
  fileName,
  embedded = false,
}: {
  route: ParsedGpxRoute | null;
  fileName: string | null;
  embedded?: boolean;
}) {
  return (
    <section>
      {embedded ? null : (
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {route?.name ?? fileName ?? "Waiting for import"}
            </h2>
          </div>
        </div>
      )}

      {route && (
        <div
          className={`${embedded ? "" : "mt-6"} grid gap-4 md:grid-cols-2 xl:grid-cols-5`}
        >
          <MetricCard
            label="Distance"
            value={formatDistance(route.totalDistanceMeters)}
          />
          <MetricCard
            label="Total ascent"
            value={formatElevation(route.totalAscentMeters)}
          />
          <MetricCard
            label="Total descent"
            value={formatElevation(route.totalDescentMeters)}
          />
          <MetricCard label="D+ / km" value={formatAscentRatioPerKm(route)} />
          <MetricCard
            label="Weighted avg slope"
            value={formatWeightedAverageSlope(route)}
          />
        </div>
      )}
    </section>
  );
}

function formatAscentRatioPerKm(route: ParsedGpxRoute): string {
  const value = calculateAscentRatioPerKm(route);
  return value === null ? "Unavailable" : `${Math.round(value)} m/km`;
}

function formatWeightedAverageSlope(route: ParsedGpxRoute): string {
  const value = calculateWeightedAverageSlope(route);
  return value === null ? "Unavailable" : `${value.toFixed(1)}%`;
}
