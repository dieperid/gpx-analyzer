import {
  calculateElevationGainLoss,
  smoothElevationSamples,
} from "@/lib/elevation-analysis";

export type GpxPoint = {
  latitude: number;
  longitude: number;
  elevation: number | null;
};

export type GpxSegment = {
  index: number;
  points: GpxPoint[];
  totalDistanceMeters: number;
};

export type ElevationSample = {
  distanceMeters: number;
  elevation: number;
};

export type ParsedGpxRoute = {
  name: string | null;
  points: GpxPoint[];
  segments: GpxSegment[];
  trackCount: number;
  segmentCount: number;
  totalDistanceMeters: number;
  elevationProfile: ElevationSample[];
  elevationPointCount: number;
  totalAscentMeters: number | null;
  totalDescentMeters: number | null;
  ignoredPointCount: number;
  sourceTrackIndex: number;
};

type ParsedTrack = {
  index: number;
  name: string | null;
  points: GpxPoint[];
  segments: GpxSegment[];
  rawSegmentCount: number;
  rawPointCount: number;
  ignoredPointCount: number;
  totalDistanceMeters: number;
};

export class EmptyGpxError extends Error {
  constructor(message = "The selected GPX file is empty.") {
    super(message);
    this.name = "EmptyGpxError";
  }
}

export class InvalidGpxError extends Error {
  constructor(
    message = "The selected file is invalid. Please import a valid GPX document.",
  ) {
    super(message);
    this.name = "InvalidGpxError";
  }
}

export class NoTrackDetectedError extends Error {
  constructor(
    message = "No track was detected in this GPX file. Please import a file containing a route track.",
  ) {
    super(message);
    this.name = "NoTrackDetectedError";
  }
}

export class NoUsableTrackError extends Error {
  constructor(
    message = "A track was found, but it cannot be used because it does not contain enough valid points.",
  ) {
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

  const trackNodes = getChildrenByName(root, "trk");
  if (trackNodes.length === 0) {
    throw new NoTrackDetectedError();
  }

  const tracks = trackNodes.map((trackNode, index) => parseTrack(trackNode, index));
  const totalRawPointCount = tracks.reduce(
    (sum, track) => sum + track.rawPointCount,
    0,
  );

  if (totalRawPointCount === 0) {
    throw new NoTrackDetectedError(
      "No track points were detected in this GPX file. Please import a file containing a route track.",
    );
  }

  const mainTrack = selectMainTrack(tracks);
  if (!mainTrack || mainTrack.points.length < 2) {
    throw new NoUsableTrackError();
  }

  const routeAnalysis = analyzeRoute(mainTrack.points);

  return {
    name: mainTrack.name,
    points: mainTrack.points,
    segments: mainTrack.segments,
    trackCount: trackNodes.length,
    segmentCount: mainTrack.rawSegmentCount,
    totalDistanceMeters: routeAnalysis.totalDistanceMeters,
    elevationProfile: routeAnalysis.elevationProfile,
    elevationPointCount: routeAnalysis.elevationProfile.length,
    totalAscentMeters: routeAnalysis.totalAscentMeters,
    totalDescentMeters: routeAnalysis.totalDescentMeters,
    ignoredPointCount: mainTrack.ignoredPointCount,
    sourceTrackIndex: mainTrack.index,
  };
}

function parseTrack(trackNode: Element, index: number): ParsedTrack {
  const segmentNodes = getChildrenByName(trackNode, "trkseg");
  const segments: GpxSegment[] = [];
  const points: GpxPoint[] = [];
  let rawPointCount = 0;
  let ignoredPointCount = 0;

  for (const [segmentIndex, segmentNode] of segmentNodes.entries()) {
    const segmentPoints: GpxPoint[] = [];

    for (const pointNode of getChildrenByName(segmentNode, "trkpt")) {
      rawPointCount += 1;

      const point = parseTrackPoint(pointNode);
      if (!point) {
        ignoredPointCount += 1;
        continue;
      }

      segmentPoints.push(point);
      points.push(point);
    }

    if (segmentPoints.length === 0) {
      continue;
    }

    segments.push({
      index: segmentIndex,
      points: segmentPoints,
      totalDistanceMeters: calculateTotalDistance(segmentPoints),
    });
  }

  return {
    index,
    name: getTextContent(getChildrenByName(trackNode, "name")[0]),
    points,
    segments,
    rawSegmentCount: segmentNodes.length,
    rawPointCount,
    ignoredPointCount,
    totalDistanceMeters: calculateTotalDistance(points),
  };
}

function selectMainTrack(tracks: ParsedTrack[]): ParsedTrack | null {
  const candidates = tracks.filter((track) => track.points.length > 0);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((bestTrack, currentTrack) => {
    if (currentTrack.points.length > bestTrack.points.length) {
      return currentTrack;
    }

    if (
      currentTrack.points.length === bestTrack.points.length &&
      currentTrack.totalDistanceMeters > bestTrack.totalDistanceMeters
    ) {
      return currentTrack;
    }

    return bestTrack;
  });
}

function parseTrackPoint(pointNode: Element): GpxPoint | null {
  const latitude = Number(pointNode.getAttribute("lat"));
  const longitude = Number(pointNode.getAttribute("lon"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const elevationNode = getChildrenByName(pointNode, "ele")[0];
  const elevation = elevationNode
    ? Number.parseFloat(elevationNode.textContent ?? "")
    : null;

  return {
    latitude,
    longitude,
    elevation: Number.isFinite(elevation) ? elevation : null,
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

function analyzeRoute(points: GpxPoint[]): {
  totalDistanceMeters: number;
  elevationProfile: ElevationSample[];
  totalAscentMeters: number | null;
  totalDescentMeters: number | null;
} {
  let totalDistanceMeters = 0;
  const rawElevationProfile: ElevationSample[] = [];

  if (points[0]?.elevation !== null) {
    rawElevationProfile.push({
      distanceMeters: 0,
      elevation: points[0].elevation,
    });
  }

  for (let index = 1; index < points.length; index += 1) {
    totalDistanceMeters += haversineDistance(points[index - 1], points[index]);

    const elevation = points[index].elevation;
    if (elevation !== null) {
      rawElevationProfile.push({
        distanceMeters: totalDistanceMeters,
        elevation,
      });
    }
  }

  const elevationProfile = smoothElevationSamples(rawElevationProfile);

  if (elevationProfile.length < 2) {
    return {
      totalDistanceMeters,
      elevationProfile,
      totalAscentMeters: null,
      totalDescentMeters: null,
    };
  }

  const { gainMeters: totalAscentMeters, lossMeters: totalDescentMeters } =
    calculateElevationGainLoss(elevationProfile);

  return {
    totalDistanceMeters,
    elevationProfile,
    totalAscentMeters,
    totalDescentMeters,
  };
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
