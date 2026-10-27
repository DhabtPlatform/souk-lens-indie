"use client";
import { CircleHelp } from "lucide-react";

// Collapsible "how it works / how to use" explainer — one per feature,
// so every part of the app teaches itself without cluttering the UI.
export function HowItWorks({ steps, lang }: { steps: string[]; lang: "ar" | "en" }) {
  if (!steps.length) return null;
  return (
    <details className="group rounded-xl border border-dashed bg-muted/40 px-3.5 py-2.5">
      <summary className="flex cursor-pointer items-center gap-2 py-1 text-sm font-bold text-primary marker:hidden">
        <CircleHelp className="h-4 w-4 shrink-0" />
        {lang === "ar" ? "إزاي تشتغل؟ خطوة بخطوة" : "How does it work? Step by step"}
        <span className="ms-auto text-xs font-normal text-muted-foreground transition group-open:rotate-180">▾</span>
      </summary>
      <ol className="space-y-1.5 pb-1.5 pt-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] leading-6 text-muted-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-black text-primary">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
