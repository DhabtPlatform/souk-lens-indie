"use client";

// Always-visible micro-explanation next to any field, button or box —
// one short line that tells the visitor (or judge) what this control does.
export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="-mt-1 text-[11px] leading-5 text-muted-foreground">{children}</p>;
}
