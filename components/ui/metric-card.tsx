export default function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <p className="text-xs text-center font-semibold uppercase text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-center text-slate-950">
        {value}
      </p>
    </div>
  );
}
