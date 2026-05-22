import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://aditya-finance.vercel.app"),
  title: {
    default: "Stockscore — Sector-Relative Equity Scoring",
    template: "%s — Stockscore",
  },
  description:
    "Transparent fundamental analysis of Indian equities, scored sector by sector.",
  openGraph: {
    title: "Stockscore — Sector-Relative Equity Scoring",
    description:
      "Transparent fundamental analysis of Indian equities, scored sector by sector.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-ink-950 text-chalk-100 font-sans antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
