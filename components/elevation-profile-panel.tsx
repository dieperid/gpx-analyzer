import ElevationProfileChart from "@/components/elevation-profile-chart";
import { type ParsedGpxRoute } from "@/lib/gpx";

export default function ElevationProfilePanel({
  route,
  embedded = false,
}: {
  route: ParsedGpxRoute | null;
  embedded?: boolean;
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
          <ElevationProfileChart route={route} fullBleed={embedded} />
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
