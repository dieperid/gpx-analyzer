import ElevationProfilePanel from "@/components/elevation-profile-panel";
import RouteOverviewSection from "@/components/route-overview-section";
import { type ParsedGpxRoute } from "@/lib/gpx";

export default function ProfileOverviewSection({
  route,
  fileName,
}: {
  route: ParsedGpxRoute | null;
  fileName: string | null;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            {route?.name ?? fileName ?? "Elevation profile and overview"}
          </h2>
        </div>
      </div>

      <ElevationProfilePanel route={route} embedded />

      <div className="px-6 py-6">
        <RouteOverviewSection route={route} fileName={fileName} embedded />
      </div>
    </section>
  );
}
