import RouteMap from "@/components/route-map";
import { type ParsedGpxRoute } from "@/lib/gpx";

export default function RouteMapSection({
  route,
  fileName,
  importId,
}: {
  route: ParsedGpxRoute | null;
  fileName: string | null;
  importId: string | null;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            {route?.name ?? fileName ?? "Route map"}
          </h2>
        </div>
      </div>

      {route && importId ? (
        <RouteMap key={importId} route={route} embedded />
      ) : (
        <div className="flex h-105 items-center justify-center bg-slate-50 px-6 text-sm text-slate-500">
          Import a GPX file to display the route map.
        </div>
      )}
    </section>
  );
}
