"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

interface Announcement {
  title: string;
  date: string;
  summary: string;
  url: string;
}

interface Props {
  announcements: Announcement[];
  heading: string;
}

export function AnnouncementList({ announcements, heading }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? announcements : announcements.slice(0, 1);

  return (
    <div>
      <h3 className="text-xs font-semibold text-chalk-300/70 uppercase tracking-wider mb-2">
        {heading}
      </h3>
      <div className="space-y-2">
        {visible.map((a, i) => (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noreferrer noopener"
            className="block rounded-lg border border-ink-700/60 bg-ink-900/40 px-4 py-3 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-chalk-100 leading-snug flex-1">
                {a.summary || a.title}
              </p>
              <ExternalLink className="h-3 w-3 text-chalk-300/40 shrink-0 mt-0.5" />
            </div>
            <p className="text-xs text-chalk-300/50 mt-1.5 num">{a.date}</p>
          </a>
        ))}
      </div>
      {announcements.length > 1 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 text-xs text-chalk-300/60 hover:text-accent transition-colors"
        >
          {showAll ? "Hide" : `View all (${announcements.length})`}
        </button>
      )}
    </div>
  );
}
