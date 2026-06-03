import { Copy, Linkedin, Mail, MapPin, Briefcase } from "lucide-react";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata = { title: "Contact & Feedback" };

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
        within 24 hours.
      </p>

      {/* Open to work callout */}
      <div className="mt-8 flex gap-4 rounded-2xl border border-accent/20 bg-accent/5 p-5 ring-1 ring-accent/10">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
          <Briefcase className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-chalk-50">
            Open to opportunities
          </p>
          <p className="mt-1 text-sm text-chalk-300/70 leading-relaxed">
            I am actively seeking roles in{" "}
            <span className="text-chalk-200 font-medium">investment advisory</span> and{" "}
            <span className="text-chalk-200 font-medium">equity analysis</span>.
            If you are hiring — or know someone who is — I would be glad to connect.
            Use the form below or reach out directly on LinkedIn.
          </p>
        </div>
      </div>

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
          href="https://www.linkedin.com/in/adi33/"
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
            <p className="text-chalk-50 font-medium">/in/adi33</p>
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
            <p className="text-chalk-50 font-medium">Bengaluru, KA, India</p>
          </div>
        </div>
      </div>

      {/* Contact / feedback form */}
      <div className="mt-16">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">
          Get in touch
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-chalk-50">
          Send a message
        </h2>
        <p className="mt-2 mb-8 text-sm text-chalk-300/60">
          Whether you have a role to discuss, product feedback, or a general enquiry — the form takes under a minute.
        </p>
        <div className="rounded-2xl border border-ink-700/60 bg-ink-900/30 p-6">
          <FeedbackForm />
        </div>
      </div>
    </div>
  );
}
