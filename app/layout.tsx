import type { Metadata, Viewport } from "next";
import { Cairo, Inter, Tajawal } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700", "800", "900"], variable: "--font-tajawal", display: "swap" });
const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "600", "700", "800"], variable: "--font-cairo", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700", "800", "900"], variable: "--font-inter", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Souk Lens — عدسة السوق | Meta AI Hackathon",
  description: "Snap, speak, search — turn anything into a ready listing. SAM 3.1 + Muse Spark + Muse Image + Voice.",
  manifest: "/manifest.webmanifest",
  applicationName: "Souk Lens",
  appleWebApp: { capable: true, title: "Souk Lens", statusBarStyle: "black-translucent" },
  icons: { icon: "/logo.svg", apple: "/logo.svg", shortcut: "/logo.svg" },
  openGraph: { title: "Souk Lens — عدسة السوق", description: "Turn any photo, voice note, link or old store into a complete listing.", images: ["/brand/og-cover.svg"] },
};

export const viewport: Viewport = { themeColor: "#7c5cff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${tajawal.variable} ${cairo.variable} ${inter.variable}`}>
      <body>
        {children}
        <Toaster richColors position="top-center" toastOptions={{ style: { fontFamily: "inherit" } }} />
      </body>
    </html>
  );
}
