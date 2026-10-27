import { cn } from "@/lib/utils";

// Souk Lens mark: a lens that found the gem — souk arch inside, stall baseline below.
// Inline SVG so it stays crisp and flips with layout direction in the lockup.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-11 w-11 shrink-0 drop-shadow-lg", className)} role="img" aria-label="Souk Lens">
      <defs>
        <linearGradient id="sl-mark" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B6CFF" /><stop offset=".52" stopColor="#7C5CFF" /><stop offset="1" stopColor="#00C2A8" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="17" fill="url(#sl-mark)" />
      <rect x="3.75" y="3.75" width="56.5" height="56.5" rx="16.25" fill="none" stroke="#fff" strokeOpacity=".24" strokeWidth="1.5" />
      <circle cx="32" cy="29" r="13.5" fill="none" stroke="#fff" strokeWidth="4.6" />
      <path d="M25.5 36.5v-4.2c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5v4.2" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M21 46.5h22" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M25 42.5h14" stroke="#fff" strokeOpacity=".72" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="46.5" cy="15.5" r="4.6" fill="#FFD166" />
    </svg>
  );
}

export function LogoLockup({ lang, className }: { lang: "ar" | "en"; className?: string }) {
  const ar = lang === "ar";
  return (
    <span className={cn("flex min-w-0 items-center gap-3", className)}>
      <LogoMark />
      <span className="min-w-0">
        <span className="block truncate text-lg font-black leading-6 tracking-tight">
          {ar ? "عدسة السوق" : "Souk Lens"}
          <span className="ms-2 align-middle text-[10px] font-extrabold uppercase tracking-[.18em] text-accent">{ar ? "SOUK LENS" : "عدسة السوق"}</span>
        </span>
        <span className="hidden truncate text-xs text-muted-foreground sm:block">
          {ar ? "صوّر، اتكلم، ابحث — وحول أي حاجة لإعلان جاهز" : "See it. Sell it. Anywhere."}
        </span>
      </span>
    </span>
  );
}
