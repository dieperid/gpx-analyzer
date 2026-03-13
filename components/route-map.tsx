import dynamic from "next/dynamic";
import { type ParsedGpxRoute } from "@/lib/gpx";

const RouteMapClient = dynamic(() => import("./route-map-client"), {
  ssr: false,
  loading: () => (
    <div className="flex h-160 items-center justify-center bg-slate-100 text-sm text-slate-500">
      Loading map...
    </div>
  ),
});

export default function RouteMap({
  route,
  embedded = false,
}: {
  route: ParsedGpxRoute;
  embedded?: boolean;
}) {
  return <RouteMapClient route={route} embedded={embedded} />;
}
