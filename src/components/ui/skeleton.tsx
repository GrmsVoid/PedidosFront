import { cn } from "@/lib/cn";

/** Placeholder de carga con brillo animado. Dale tamaño con className. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton-shimmer rounded-sm", className)} />;
}
