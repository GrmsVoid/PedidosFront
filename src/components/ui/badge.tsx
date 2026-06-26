import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "slate" | "blue" | "amber" | "green" | "red" | "violet";

const TONES: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-600/10",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/15",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/15",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  red: "bg-red-50 text-red-700 ring-red-600/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
};

export function Badge({
  tone = "slate",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-tight ring-1 ring-inset",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
