import { Copy, Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        Contact
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-chalk-50">
        Let's talk.
      </h1>
      <p className="mt-3 text-chalk-300 serif text-lg leading-relaxed">
        The best way to reach me is email — I read every message and respond
        within 24 hours. If you're hiring in wealth management, investment
        advisory, or fintech, I'd particularly love to hear from you.
      </p>

      <div className="mt-10 space-y-3">
        <a
          href="mailto:aditya33agrawal@gmail.com"
          className="group flex items-center justify-between gap-4 rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 hover:border-accent/40 hover:bg-ink-900 transition-colors"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-chalk-300/70 uppercase tracking-wider">
                Email
              </p>
              <p className="text-chalk-50 font-medium num">
                aditya33agrawal@gmail.com
              </p>
            </div>
          </div>
          <Copy className="h-4 w-4 text-chalk-300 group-hover:text-accent" />
        </a>

        <a
          href="tel:+919565117059"
          className="group flex items-center gap-4 rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 hover:border-accent/40 hover:bg-ink-900 transition-colors"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
            <Phone className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-chalk-300/70 uppercase tracking-wider">
              Phone
            </p>
            <p className="text-chalk-50 font-medium num">+91 95651 17059</p>
          </div>
        </a>

        <a
          href="https://www.linkedin.com/in/aditya33agrawal/"
          target="_blank"
          rel="noreferrer noopener"
          className="group flex items-center gap-4 rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 hover:border-accent/40 hover:bg-ink-900 transition-colors"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
            <Linkedin className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-chalk-300/70 uppercase tracking-wider">
              LinkedIn
            </p>
            <p className="text-chalk-50 font-medium">/in/aditya33agrawal</p>
          </div>
        </a>

        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer noopener"
          className="group flex items-center gap-4 rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 hover:border-accent/40 hover:bg-ink-900 transition-colors"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
            <Github className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-chalk-300/70 uppercase tracking-wider">
              GitHub
            </p>
            <p className="text-chalk-50 font-medium">
              Source code for this project
            </p>
          </div>
        </a>

        <div className="flex items-center gap-4 rounded-xl border border-ink-700/60 bg-ink-900/20 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-800 text-chalk-300 ring-1 ring-ink-700">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-chalk-300/70 uppercase tracking-wider">
              Based in
            </p>
            <p className="text-chalk-50 font-medium">Bengaluru, India</p>
          </div>
        </div>
      </div>
    </div>
  );
}
