export type GpxPoint = {
  latitude: number;
  longitude: number;
  elevation: number | null;
};

export type ParsedGpxRoute = {
  name: string | null;
  points: GpxPoint[];
  trackCount: number;
  segmentCount: number;
  totalDistanceMeters: number;
};

export class EmptyGpxError extends Error {
  constructor(message = "The selected GPX file is empty.") {
    super(message);
    this.name = "EmptyGpxError";
  }
}

export class InvalidGpxError extends Error {
  constructor(message = "The selected file is not a valid GPX document.") {
    super(message);
    this.name = "InvalidGpxError";
  }
}

export class NoUsableTrackError extends Error {
  constructor(message = "No usable track was found in this GPX file.") {
    super(message);
    this.name = "NoUsableTrackError";
  }
}

export function parseGpx(xmlContent: string): ParsedGpxRoute {
  if (!xmlContent.trim()) {
    throw new EmptyGpxError();
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(xmlContent, "application/xml");

  if (document.querySelector("parsererror")) {
    throw new InvalidGpxError();
  }

  const root = document.documentElement;
  if (!root || root.localName !== "gpx") {
    throw new InvalidGpxError();
  }

  const tracks = getChildrenByName(root, "trk");
  if (tracks.length === 0) {
    throw new EmptyGpxError("This GPX file does not contain any track data.");
  }

  const points: GpxPoint[] = [];
  let routeName: string | null = null;
  let segmentCount = 0;
  let rawTrackPointCount = 0;

  for (const track of tracks) {
    routeName ??= getTextContent(getChildrenByName(track, "name")[0]);

    for (const segment of getChildrenByName(track, "trkseg")) {
      segmentCount += 1;

      for (const point of getChildrenByName(segment, "trkpt")) {
        rawTrackPointCount += 1;
        const latitude = Number(point.getAttribute("lat"));
        const longitude = Number(point.getAttribute("lon"));

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          continue;
        }

        const elevationNode = getChildrenByName(point, "ele")[0];
        const elevation = elevationNode
          ? Number.parseFloat(elevationNode.textContent ?? "")
          : null;

        points.push({
          latitude,
          longitude,
          elevation: Number.isFinite(elevation) ? elevation : null,
        });
      }
    }
  }

  if (segmentCount === 0 || rawTrackPointCount === 0) {
    throw new EmptyGpxError("This GPX file does not contain any track points.");
  }

  if (points.length < 2) {
    throw new NoUsableTrackError();
  }

  return {
    name: routeName,
    points,
    trackCount: tracks.length,
    segmentCount,
    totalDistanceMeters: calculateTotalDistance(points),
  };
}

function getChildrenByName(parent: Element, name: string): Element[] {
  return Array.from(parent.children).filter((child) => child.localName === name);
}

function getTextContent(node: Element | undefined): string | null {
  const value = node?.textContent?.trim();
  return value ? value : null;
}

function calculateTotalDistance(points: GpxPoint[]): number {
  let total = 0;

  for (let index = 1; index < points.length; index += 1) {
    total += haversineDistance(points[index - 1], points[index]);
  }

  return total;
}

function haversineDistance(start: GpxPoint, end: GpxPoint): number {
  const earthRadiusMeters = 6_371_000;
  const latDelta = toRadians(end.latitude - start.latitude);
  const lonDelta = toRadians(end.longitude - start.longitude);
  const startLat = toRadians(start.latitude);
  const endLat = toRadians(end.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
