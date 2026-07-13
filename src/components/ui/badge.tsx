import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "slate" | "blue" | "amber" | "green" | "red" | "violet";

// Tonos funcionales sobrios: fondo casi blanco + texto profundo + hairline del
// propio color. En un sistema monocromo, el color solo aparece para comunicar
// estado — nunca como decoración.
const TONES: Record<Tone, string> = {
  slate: "bg-slate-50 text-slate-600 ring-slate-500/20",
  blue: "bg-blue-50/70 text-blue-700 ring-blue-600/20",
  amber: "bg-amber-50/70 text-amber-700 ring-amber-600/25",
  green: "bg-emerald-50/70 text-emerald-700 ring-emerald-600/20",
  red: "bg-red-50/70 text-red-700 ring-red-600/20",
  violet: "bg-violet-50/70 text-violet-700 ring-violet-600/20",
};

export function Badge({
  tone = "slate",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] ring-1 ring-inset",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
