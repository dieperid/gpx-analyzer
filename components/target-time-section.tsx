import { type ChangeEvent } from "react";
import type { ParsedTargetTime, TargetTimeInput } from "@/lib/target-time";
import TimeField from "@/components/ui/time-field";

export default function TargetTimeSection({
  value,
  targetTime,
  onFieldChange,
}: {
  value: TargetTimeInput;
  targetTime: ParsedTargetTime;
  onFieldChange: (
    field: keyof TargetTimeInput,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Define your target time
          </h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <TimeField
          label="Hours"
          placeholder="00"
          value={value.hours}
          onChange={(event) => onFieldChange("hours", event)}
        />
        <TimeField
          label="Minutes"
          placeholder="00"
          value={value.minutes}
          onChange={(event) => onFieldChange("minutes", event)}
        />
        <TimeField
          label="Seconds"
          placeholder="00"
          value={value.seconds}
          onChange={(event) => onFieldChange("seconds", event)}
        />
      </div>

      {targetTime.status === "empty" ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Enter a target time to unlock pace, summary, and split calculations.
        </div>
      ) : targetTime.status === "invalid" ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {targetTime.errorMessage}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Enter `hours`, `minutes`, and `seconds`. Minutes and seconds must stay
          between `00` and `59`.
        </p>
      )}
    </section>
  );
}
