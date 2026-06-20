"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AssetNode } from "@/lib/allocation";
import { formatINR } from "./AmountSlider";

function Node({ node, depth }: { node: AssetNode; depth: number }) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = !!node.children?.length;

  return (
    <div className={depth > 0 ? "ml-4 border-l border-ink-700/40 pl-3" : ""}>
      <button
        onClick={() => hasChildren && setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left ${
          hasChildren ? "hover:bg-ink-800/60 cursor-pointer" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            open ? (
              <ChevronDown className="h-3.5 w-3.5 text-chalk-300/60 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-chalk-300/60 shrink-0" />
            )
          ) : (
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: node.color }}
            />
          )}
          <div className="min-w-0">
            <p className={`truncate ${depth === 0 ? "text-sm font-semibold text-chalk-50" : "text-sm text-chalk-100"}`}>
              {node.label}
            </p>
            {!hasChildren && node.instrument && (
              <p className="text-xs text-chalk-300/70 truncate">{node.instrument}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="num text-sm font-semibold text-chalk-100">{node.pct}%</p>
          <p className="num text-xs text-chalk-300/60">{formatINR(node.amount)}</p>
        </div>
      </button>
      {!hasChildren && node.case && (
        <p className="ml-7 mb-1 text-xs text-chalk-300/70">{node.case}</p>
      )}
      {hasChildren && open && (
        <div className="space-y-0.5">
          {node.children!.map((c) => (
            <Node key={c.key} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AllocationTree({ tree }: { tree: AssetNode[] }) {
  return (
    <div className="space-y-1">
      {tree.map((n) => (
        <Node key={n.key} node={n} depth={0} />
      ))}
    </div>
  );
}
