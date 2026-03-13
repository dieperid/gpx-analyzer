"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import { type ParsedGpxRoute } from "@/lib/gpx";

export default function RouteMapClient({
  route,
  embedded = false,
}: {
  route: ParsedGpxRoute;
  embedded?: boolean;
}) {
  const positions: LatLngExpression[] = route.points.map((point) => [
    point.latitude,
    point.longitude,
  ]);
  const bounds = positions as LatLngBoundsExpression;
  const startPoint = route.points[0];
  const endPoint = route.points[route.points.length - 1];
  const startPosition: LatLngExpression = [
    startPoint.latitude,
    startPoint.longitude,
  ];
  const finishPosition: LatLngExpression = getFinishMarkerPosition(
    startPoint,
    endPoint,
  );

  return (
    <div
      className={
        embedded
          ? ""
          : "overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
      }
    >
      {embedded ? null : (
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Route map
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {route.name ?? `Track #${route.sourceTrackIndex + 1}`}
            </h2>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            Auto-fit enabled
          </div>
        </div>
      )}
      <div className="h-[320px] w-full sm:h-[420px]">
        <MapContainer
          center={startPosition}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline
            positions={positions}
            pathOptions={{
              color: "#0f766e",
              weight: 5,
              opacity: 0.9,
            }}
          />
          <CircleMarker
            center={startPosition}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#16a34a",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              Start
            </Tooltip>
          </CircleMarker>
          <CircleMarker
            center={finishPosition}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#dc2626",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              Finish
            </Tooltip>
          </CircleMarker>
          <FitRouteBounds bounds={bounds} />
        </MapContainer>
      </div>
    </div>
  );
}

function FitRouteBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, {
      padding: [36, 36],
      maxZoom: 15,
    });
  }, [bounds, map]);

  return null;
}

function getFinishMarkerPosition(
  startPoint: ParsedGpxRoute["points"][number],
  endPoint: ParsedGpxRoute["points"][number],
): LatLngExpression {
  if (
    startPoint.latitude === endPoint.latitude &&
    startPoint.longitude === endPoint.longitude
  ) {
    return [endPoint.latitude + 0.00018, endPoint.longitude + 0.00018];
  }

  return [endPoint.latitude, endPoint.longitude];
}
