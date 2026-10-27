import { cn } from "@/lib/utils";

// Souk Lens identity v2 — evolved mark + hand-drawn logotype (paths, no font dependency).
// Mark: lens that found the gem — souk arch inside, stall baseline, sheen + sparkle.
// Wordmark: custom monolinear letterforms; both O's are lens rings, the SOUK O
// carries the gold gem; LENS runs violet→mint.

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-11 w-11 shrink-0 drop-shadow-lg", className)} role="img" aria-label="Souk Lens">
      <defs>
        <linearGradient id="sl-mark" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B6CFF" /><stop offset=".52" stopColor="#7C5CFF" /><stop offset="1" stopColor="#00C2A8" />
        </linearGradient>
        <linearGradient id="sl-ring" x1="20" y1="14" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#E9FFF8" />
        </linearGradient>
        <radialGradient id="sl-sheen" cx=".28" cy=".12" r=".55" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".22" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <clipPath id="sl-tile"><rect x="3" y="3" width="58" height="58" rx="17" /></clipPath>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="17" fill="url(#sl-mark)" />
      <g clipPath="url(#sl-tile)"><ellipse cx="18" cy="8" rx="30" ry="20" fill="url(#sl-sheen)" /></g>
      <rect x="3.75" y="3.75" width="56.5" height="56.5" rx="16.25" fill="none" stroke="#fff" strokeOpacity=".24" strokeWidth="1.5" />
      <circle cx="32" cy="29" r="13.5" fill="none" stroke="url(#sl-ring)" strokeWidth="4.6" />
      <circle cx="22.6" cy="19.8" r="2.1" fill="#FFFFFF" opacity=".9" />
      <path d="M25.5 36.5v-4.2c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5v4.2" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M21 46.5h22" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M25 42.5h14" stroke="#fff" strokeOpacity=".72" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="46.5" cy="15.5" r="4.6" fill="#FFD166" />
      <path d="M53.5 5.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#FFFFFF" opacity=".95" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 112" className={cn("h-7 w-auto shrink-0", className)} role="img" aria-label="Souk Lens logotype">
      <defs>
        <linearGradient id="sl-wg" x1="270" y1="24" x2="498" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B6CFF" /><stop offset=".55" stopColor="#7C5CFF" /><stop offset="1" stopColor="#00C2A8" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#F6F6F8" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
        <path d="M44 40 C44 31 37 26 29 26 C20 26 14 31 14 39 C14 47 20 51 29 53 L31 53.5 C40 55.5 48 59 48 68 C48 77 41 86 32 86 C23 86 16 81 15 72" />
        <path d="M70 56 A21 30 0 1 0 112 56 A21 30 0 1 0 70 56" />
        <path d="M132 24 V62 C132 76 142 86 153 86 C164 86 174 76 174 62 V24" />
        <path d="M194 24 V88 M236 26 L203 55 L239 88" />
      </g>
      <g fill="none" stroke="#F6F6F8" strokeWidth="7">
        <path d="M81 56 A10 15 0 1 0 101 56 A10 15 0 1 0 81 56" />
      </g>
      <circle cx="91" cy="56" r="5.5" fill="#FFD166" />
      <g fill="none" stroke="url(#sl-wg)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
        <path d="M270 24 V88 H312" />
        <path d="M374 24 H332 V88 H374 M332 56 H366" />
        <path d="M394 88 V24 L436 88 V24" />
        <path d="M492 40 C492 31 485 26 477 26 C468 26 462 31 462 39 C462 47 468 51 477 53 L479 53.5 C488 55.5 496 59 496 68 C496 77 489 86 480 86 C471 86 464 81 463 72" />
      </g>
    </svg>
  );
}

export function LogoLockup({ lang, className }: { lang: "ar" | "en"; className?: string }) {
  const ar = lang === "ar";
  return (
    <span className={cn("flex min-w-0 items-center gap-3", className)}>
      <LogoMark />
      <span className="min-w-0">
        <Wordmark className="h-6 sm:h-7" />
        <span className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">
          {ar ? "عدسة السوق — صوّر، اتكلم، ابحث" : "See it. Sell it. Anywhere."}
        </span>
      </span>
    </span>
  );
}
