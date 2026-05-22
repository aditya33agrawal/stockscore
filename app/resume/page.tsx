import { Download, ExternalLink } from "lucide-react";

export const metadata = { title: "Resume" };

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Resume
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-chalk-50">
            Aditya Agrawal
          </h1>
          <p className="text-chalk-300 mt-1">
            Full-Stack Developer transitioning to Wealth Management & Investment
            Advisory
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/Aditya_Agrawal_Resume.pdf"
            download
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-ink-950 px-4 py-2 text-sm font-semibold hover:bg-accent/90"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
          <a
            href="/Aditya_Agrawal_Resume.pdf"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-lg border border-ink-700/60 px-4 py-2 text-sm hover:bg-ink-800/60"
          >
            <ExternalLink className="h-4 w-4" /> Open in new tab
          </a>
        </div>
      </header>

      <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 overflow-hidden">
        <object
          data="/Aditya_Agrawal_Resume.pdf"
          type="application/pdf"
          className="w-full h-[1100px] bg-white"
          aria-label="Aditya Agrawal Resume PDF"
        >
          <div className="p-8 text-center text-chalk-300">
            Your browser can't display the PDF inline.{" "}
            <a
              href="/Aditya_Agrawal_Resume.pdf"
              className="text-accent hover:underline"
            >
              Download it instead →
            </a>
          </div>
        </object>
      </div>
    </div>
  );
}
