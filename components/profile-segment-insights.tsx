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
      .sort(sortSegmentsByDifficulty)[0] ?? null;

  return (
    <section className="border-t border-slate-100 pt-6">
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <SegmentTableCard
          title="Top climbs"
          description="Ranked by total ascent within each detected climb segment."
          segments={topClimbs}
          emptyMessage="No climb segments were detected from this elevation profile."
          tone="climb"
        />
        <SegmentTableCard
          title="Top descents"
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
          className="xl:col-span-2"
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
  const badgeClasses =
    tone === "climb" ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700";

  return (
    <div
      className={`overflow-hidden rounded-[28px] border p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ${toneClasses} ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-950">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div
          className={`inline-flex min-w-10 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${badgeClasses}`}
        >
          {segments.length}
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
                <th className="border-b border-slate-200/80 px-4 py-3 font-semibold">
                  Total D+
                </th>
                <th className="border-b border-slate-200/80 px-4 py-3 font-semibold">
                  Total D-
                </th>
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
                    {formatDistance(segment.distanceKm * 1000)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-3">
                    {formatElevation(segment.totalAscentMeters)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-3">
                    {formatElevation(segment.totalDescentMeters)}
                  </td>
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

function sortSegmentsByDifficulty(
  left: TerrainSegmentSummary,
  right: TerrainSegmentSummary,
): number {
  return (
    right.difficultyScore - left.difficultyScore ||
    right.totalAscentMeters - left.totalAscentMeters ||
    right.distanceKm - left.distanceKm
  );
}

function formatGrade(gradePercent: number): string {
  return `${gradePercent >= 0 ? "+" : ""}${gradePercent.toFixed(1)}%`;
}
