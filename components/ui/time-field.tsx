import { type ChangeEvent } from "react";

export default function TimeField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <input
        inputMode="numeric"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-3 w-full border-0 bg-transparent p-0 text-4xl font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-300"
      />
    </label>
  );
}
