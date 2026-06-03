import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NavProgress } from "@/components/NavProgress";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const SITE_URL = "https://aditya-finance.vercel.app";
const TITLE = "Stockscore — Sector-Relative Equity Scoring";
const DESCRIPTION =
  "Transparent fundamental analysis of Indian equities, scored sector by sector across 10 categories. No black boxes — every +/− is traceable to a rule.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s — Stockscore" },
  description: DESCRIPTION,
  applicationName: "Stockscore",
  keywords: [
    "Indian stocks",
    "fundamental analysis",
    "equity scoring",
    "stock screener",
    "sector analysis",
    "Nifty",
    "BSE",
    "NSE",
  ],
  authors: [{ name: "Aditya Agrawal" }],
  creator: "Aditya Agrawal",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Stockscore",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFE3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 text-chalk-100 font-sans antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        <Navbar />
        <main id="main" className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Footer />
        <ScrollToTop />
        <Toaster
          theme="light"
          richColors
          position="top-center"
          closeButton
          toastOptions={{
            style: {
              fontSize: "13.5px",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            },
          }}
        />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
