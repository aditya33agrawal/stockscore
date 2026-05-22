import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-700/60 bg-ink-950">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center">
        <div>
          <p className="font-semibold">Aditya Agrawal</p>
          <p className="text-sm text-chalk-300">
            Full-Stack Developer transitioning to Wealth Management.
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <a
            href="mailto:aditya33agrawal@gmail.com"
            className="flex items-center gap-2 text-chalk-300 hover:text-chalk-50 transition-colors"
          >
            <Mail className="h-4 w-4" /> aditya33agrawal@gmail.com
          </a>
          <a
            href="https://www.linkedin.com/in/aditya33agrawal/"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 text-chalk-300 hover:text-chalk-50 transition-colors"
          >
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 text-chalk-300 hover:text-chalk-50 transition-colors"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
        </div>
      </div>
      <div className="border-t border-ink-700/40 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-chalk-300/70">
          <p>© {new Date().getFullYear()} Aditya Agrawal. Built with Next.js.</p>
          <p>
            Data sourced from{" "}
            <Link href="https://www.screener.in" className="underline">
              screener.in
            </Link>
            . For educational use only — not investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
