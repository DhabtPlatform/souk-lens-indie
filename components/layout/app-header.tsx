"use client";
import { LogoLockup } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, type Lang } from "@/lib/brand";
import { Moon, Palette, ShoppingCart, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export type Country = (typeof COUNTRIES)[number];

export function AppHeader({
  lang, setLang, country, setCountry, live, cartCount = 0, onCartClick,
}: {
  lang: Lang; setLang: (l: Lang) => void;
  country: Country; setCountry: (c: Country) => void;
  live: boolean; cartCount?: number; onCartClick?: () => void;
}) {
  const [light, setLight] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("light", light); }, [light]);
  const ar = lang === "ar";
  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <a href="/" className="min-w-0 shrink-0" aria-label="Souk Lens home">
          <LogoLockup lang={lang} compact />
        </a>
        <div className="ms-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Badge variant={live ? "success" : "secondary"} className="hidden sm:inline-flex">{live ? "● LIVE Meta" : (ar ? "معاينة تجريبية" : "Demo preview")}</Badge>
          <div className="w-[104px] shrink-0 sm:w-[132px]">
            <Select value={country.code} onValueChange={(v) => setCountry(COUNTRIES.find((c) => c.code === v) ?? COUNTRIES[0])}>
              <SelectTrigger aria-label="country"><SelectValue /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{ar ? c.ar : c.en} · {c.currency}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-[88px] shrink-0 sm:w-[112px]">
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger aria-label="language"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ar">العربية</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
            </Select>
          </div>
          <Button size="icon" variant="outline" onClick={() => setLight((v) => !v)} aria-label="theme" className="hidden min-[420px]:inline-flex">{light ? <Moon /> : <Sun />}</Button>
          <Button size="icon" variant={cartCount ? "default" : "outline"} onClick={onCartClick} aria-label="cart" className="relative">
            <ShoppingCart />
            {cartCount ? <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black text-black">{cartCount}</span> : null}
          </Button>
          <Button asChild variant="ghost" className="hidden md:inline-flex"><a href="/brand"><Palette />{ar ? "الهوية" : "Brand"}</a></Button>
        </div>
      </div>
    </header>
  );
}
