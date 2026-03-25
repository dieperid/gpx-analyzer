import { formatDistance, formatElevation } from "@/lib/format";
import { type ParsedGpxRoute } from "@/lib/gpx";
import {
  getTerrainSegments,
  type TerrainCategory,
  type TerrainSegmentSummary,
} from "@/lib/elevation-profile";

const TOP_SEGMENT_LIMIT = 5;

export default function ProfileSegmentInsights({
  route,
}: {
  route: ParsedGpxRoute | null;
}) {
  if (!route) {
    return null;
  }

  const segments = getTerrainSegments(route);
  const topClimbs = segments
    .filter((segment) => segment.type === "climb")
    .sort(sortClimbSegments)
    .slice(0, TOP_SEGMENT_LIMIT);
  const topDescents = segments
    .filter((segment) => segment.type === "descent")
    .sort(sortDescentSegments)
    .slice(0, TOP_SEGMENT_LIMIT);
  const hardestClimb =
    segments
      .filter((segment) => segment.type === "climb")
      .sort(sortHardestClimbSegments)[0] ?? null;
  const hardestDescent =
    segments
      .filter((segment) => segment.type === "descent")
      .sort(sortHardestDescentSegments)[0] ?? null;

  return (
    <section className="border-t border-slate-100 pt-2">
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <SegmentTableCard
          title="Top 5 climbs"
          description="Ranked by total ascent within each detected climb segment."
          segments={topClimbs}
          emptyMessage="No climb segments were detected from this elevation profile."
          tone="climb"
        />
        <SegmentTableCard
          title="Top 5 descents"
          description="Ranked by total descent within each detected downhill segment."
          segments={topDescents}
          emptyMessage="No descent segments were detected from this elevation profile."
          tone="descent"
        />
        <SegmentTableCard
          title="Hardest climb"
          description="Picked from the detected climbs using a combined length-and-grade difficulty score."
          segments={hardestClimb ? [hardestClimb] : []}
          emptyMessage="A hardest climb could not be identified for this route."
          tone="climb"
        />
        <SegmentTableCard
          title="Hardest descent"
          description="Picked from the detected descents using the same combined length-and-grade difficulty score."
          segments={hardestDescent ? [hardestDescent] : []}
          emptyMessage="A hardest descent could not be identified for this route."
          tone="descent"
        />
      </div>
    </section>
  );
}

function SegmentTableCard({
  title,
  description,
  segments,
  emptyMessage,
  tone,
  className = "",
}: {
  title: string;
  description: string;
  segments: TerrainSegmentSummary[];
  emptyMessage: string;
  tone: Extract<TerrainCategory, "climb" | "descent">;
  className?: string;
}) {
  const toneClasses =
    tone === "climb" ? "border-red-200 bg-red-50" : "border-sky-200 bg-sky-50";
  const showAscentColumn = tone === "climb";
  const showDescentColumn = tone === "descent";

  return (
    <div
      className={`overflow-hidden rounded-[28px] border p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ${toneClasses} ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-950">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>

      {segments.length > 0 ? (
        <div className="-mx-5 mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-700">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="border-b border-slate-200/80 px-4 py-3 font-semibold">
                  Start distance
                </th>
                <th className="border-b border-slate-200/80 px-4 py-3 font-semibold">
                  End distance
                </th>
                <th className="border-b border-slate-200/80 px-4 py-3 font-semibold">
                  Segment distance
                </th>
                {showAscentColumn ? (
                  <th className="border-b border-slate-200/80 px-4 py-3 font-semibold">
                    Total D+
                  </th>
                ) : null}
                {showDescentColumn ? (
                  <th className="border-b border-slate-200/80 px-4 py-3 font-semibold">
                    Total D-
                  </th>
                ) : null}
                <th className="border-b border-slate-200/80 px-4 py-3 font-semibold">
                  Avg %
                </th>
                <th className="border-b border-slate-200/80 px-4 py-3 font-semibold">
                  Max %
                </th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment) => (
                <tr key={segment.id} className="align-top">
                  <td className="border-b border-slate-200/60 px-4 py-3 font-medium text-slate-950">
                    {formatDistance(segment.startDistanceKm * 1000)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-3 font-medium text-slate-950">
                    {formatDistance(segment.endDistanceKm * 1000)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-3">
                    {formatMeters(segment.distanceKm * 1000)}
                  </td>
                  {showAscentColumn ? (
                    <td className="border-b border-slate-200/60 px-4 py-3">
                      {formatElevation(segment.totalAscentMeters)}
                    </td>
                  ) : null}
                  {showDescentColumn ? (
                    <td className="border-b border-slate-200/60 px-4 py-3">
                      {formatElevation(segment.totalDescentMeters)}
                    </td>
                  ) : null}
                  <td className="border-b border-slate-200/60 px-4 py-3">
                    {formatGrade(segment.averageGradePercent)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-3">
                    {formatGrade(segment.maxGradePercent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-sm leading-6 text-slate-600">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

function sortClimbSegments(
  left: TerrainSegmentSummary,
  right: TerrainSegmentSummary,
): number {
  return (
    right.totalAscentMeters - left.totalAscentMeters ||
    right.distanceKm - left.distanceKm ||
    right.maxGradePercent - left.maxGradePercent
  );
}

function sortDescentSegments(
  left: TerrainSegmentSummary,
  right: TerrainSegmentSummary,
): number {
  return (
    right.totalDescentMeters - left.totalDescentMeters ||
    right.distanceKm - left.distanceKm ||
    Math.abs(right.maxGradePercent) - Math.abs(left.maxGradePercent)
  );
}

function sortHardestClimbSegments(
  left: TerrainSegmentSummary,
  right: TerrainSegmentSummary,
): number {
  return (
    right.difficultyScore - left.difficultyScore ||
    right.totalAscentMeters - left.totalAscentMeters ||
    right.distanceKm - left.distanceKm
  );
}

function sortHardestDescentSegments(
  left: TerrainSegmentSummary,
  right: TerrainSegmentSummary,
): number {
  return (
    right.difficultyScore - left.difficultyScore ||
    right.totalDescentMeters - left.totalDescentMeters ||
    right.distanceKm - left.distanceKm
  );
}

function formatGrade(gradePercent: number): string {
  return `${gradePercent >= 0 ? "+" : ""}${gradePercent.toFixed(1)}%`;
}

function formatMeters(distanceMeters: number): string {
  return `${Math.round(distanceMeters).toLocaleString("en-US")} m`;
}
