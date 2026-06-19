"use client";

import { useState, type ComponentType } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { FinancialTable } from "@/components/FinancialTable";
import { FinancialCharts } from "@/components/FinancialCharts";
import { Tooltip } from "@/components/Tooltip";
import { ValuationPanel } from "@/components/ValuationPanel";
import { ReturnsPanel, LeveragePanel, TechnicalsPanel, OwnershipLiquidityPanel } from "@/components/RatioVisualPanels";
import { TOOLTIPS } from "@/lib/tooltips";
import type { ChartData } from "@/lib/company-data";
import type { Company } from "@/lib/types";

interface FinancialTables {
  quarters: string | null;
  profit_loss: string | null;
  balance_sheet: string | null;
  cash_flow: string | null;
  ratios: string | null;
  shareholding: string | null;
  peers: string | null;
}

interface GrowthTables {
  [title: string]: Record<string, string>;
}

interface Props {
  chartData: ChartData | null;
  companyName: string;
  ticker: string;
  peers: { name: string; symbol: string; ticker: string }[];
  tables?: FinancialTables;
  growthTables?: GrowthTables;
  ratiosMap?: Record<string, string>;
  factorBreakdown?: Company["factor_breakdown"];
  assumptions?: string[];
  rawTotal?: number;
}

const RATIO_GROUPS = [
  {
    label: "Valuation",
    keys: [
      "Current Price", "Market Cap", "High / Low", "Stock P/E", "Industry PE",
      "PEG Ratio", "Price to book value", "Book Value", "Intrinsic Value", "Face Value",
    ],
  },
  {
    label: "Returns & Margins",
    keys: ["ROE", "ROCE", "ROCE 5Yr", "Dividend Yield", "Profit Var 10Yrs", "Sales Var 10Yrs"],
  },
  {
    label: "Leverage & Debt",
    keys: ["Debt to equity", "Pledged percentage", "Debt", "Secured loan", "Unsecured loan", "Debt 5Years back", "Debt 10Years back"],
  },
  {
    label: "Technicals",
    keys: ["DMA 50", "DMA 200", "Down from 52w high", "Up from 52w low"],
  },
  {
    label: "Ownership & Liquidity",
    keys: ["Current Ratio", "Current ratio", "Promoter holding", "Promoter Holding"],
  },
];

const RATIO_TOOLTIP_KEY: Record<string, keyof typeof TOOLTIPS> = {
  "Current Price": "current_price",
  "High / Low": "week52_range",
  "Face Value": "face_value",
  "Stock P/E": "pe",
  "Industry PE": "pe",
  "PEG Ratio": "peg_ratio",
  "Price to book value": "price_to_book",
  "Book Value": "book_value",
  "Intrinsic Value": "intrinsic_value",
  "Market Cap": "market_cap",
  "ROE": "roe",
  "ROCE": "roce",
  "ROCE 5Yr": "roce",
  "Dividend Yield": "dividend_yield",
  "Debt to equity": "debt_to_equity",
  "Pledged percentage": "pledged_pct",
  "DMA 50": "dma",
  "DMA 200": "dma",
  "Down from 52w high": "week52_range",
  "Up from 52w low": "week52_range",
};

const GROWTH_TOOLTIP_KEY: Record<string, keyof typeof TOOLTIPS> = {
  "compounded sales growth": "sales_growth_window",
  "compounded profit growth": "profit_growth_window",
  "stock price cagr": "stock_price_cagr",
  "return on equity": "roe_growth_window",
};

const TAB_TOOLTIPS: Record<string, string> = {
  Charts: "Interactive financial charts - revenue, profit, margins, shareholding, and cash flow over time.",
  Tables: "Raw quarterly results, P&L, balance sheet, cash flow, and shareholding data from Screener.in.",
  Ratios: "All key ratios grouped by Valuation, Returns, Leverage, and Technicals.",
  Growth: "Revenue, profit, and other CAGR breakdowns over 3, 5, and 10 year periods.",
  Factors: "Per-factor scoring detail - every input that shaped the final score.",
};

type Tab = "Charts" | "Tables" | "Ratios" | "Growth" | "Factors";

export function DeepDive({
  chartData,
  companyName,
  peers,
  tables,
  growthTables,
  ratiosMap = {},
  factorBreakdown,
  assumptions,
  rawTotal,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Charts");
  const [mountedTabs, setMountedTabs] = useState<Set<Tab>>(new Set(["Charts"]));

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setMountedTabs((prev) => new Set([...prev, tab]));
  }

  const tabs: Tab[] = ["Charts", "Tables", "Ratios", "Growth", "Factors"];
  const availableTabs = tabs.filter((t) => {
    if (t === "Charts") return !!chartData;
    if (t === "Tables") return !!tables;
    if (t === "Ratios") return Object.keys(ratiosMap).length > 0;
    if (t === "Growth") return growthTables && Object.keys(growthTables).length > 0;
    if (t === "Factors") return factorBreakdown && factorBreakdown.length > 0;
    return false;
  });

  if (availableTabs.length === 0) return null;

  // Keep active tab in sync if unavailable
  const currentTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0];

  return (
    <section id="deep-dive" className="mb-10 scroll-mt-24">
      {/* Tab strip */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-0 border-b border-[rgb(var(--chalk-100)_/_0.06)] scrollbar-none">
        {availableTabs.map((tab) => (
          <Tooltip key={tab} content={{ body: TAB_TOOLTIPS[tab] ?? tab }}>
            <button
              onClick={() => switchTab(tab)}
              className={clsx(
                "shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                currentTab === tab
                  ? "border-accent text-accent"
                  : "border-transparent text-chalk-300/50 hover:text-chalk-100",
              )}
            >
              {tab}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {/* Charts */}
        {mountedTabs.has("Charts") && chartData && (
          <div className={clsx(currentTab !== "Charts" && "hidden")}>
            <FinancialCharts primaryData={chartData} primaryName={companyName} peers={peers} />
          </div>
        )}

        {/* Tables */}
        {mountedTabs.has("Tables") && tables && (
          <div className={clsx("space-y-2", currentTab !== "Tables" && "hidden")}>
            {(
              [
                ["Quarterly Results", tables.quarters, "Last 8 quarters of sales, expenses, operating profit and net profit, reported the same way every quarter."],
                ["Profit & Loss", tables.profit_loss, "Annual income statement - sales through net profit, plus dividend payout, for up to 12 years."],
                ["Balance Sheet", tables.balance_sheet, "Year-end snapshot of what the company owns (assets) and owes (liabilities + equity)."],
                ["Cash Flow", tables.cash_flow, "Cash actually moving in and out from operating, investing and financing activities each year."],
                ["Annual Ratios", tables.ratios, "Per-share metrics and key ratios (debtor days, ROE, etc.) computed for each financial year."],
                ["Shareholding Pattern", tables.shareholding, "Quarterly ownership split between promoters, FIIs, DIIs, government and the public."],
                ["Peer Comparison", tables.peers, "Same-sector companies side by side on price, P/E, market cap and key returns/margins."],
              ] as [string, string | null, string][]
            ).map(([title, csv, hint]) => (
              <details key={title} className="group glass border-subtle rounded-2xl">
                <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none select-none">
                  <span className="text-sm font-medium text-chalk-100 flex items-center">
                    {title}
                    <span onClick={(e) => e.stopPropagation()}>
                      <Tooltip content={{ body: hint }} />
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-chalk-300 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-ink-700/40">
                  <FinancialTable csv={csv} title={title} />
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Ratios */}
        {mountedTabs.has("Ratios") && Object.keys(ratiosMap).length > 0 && (
          <div className={clsx(currentTab !== "Ratios" && "hidden")}>
            <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 space-y-6">
              {(() => {
                const usedKeys = new Set<string>();
                const allKeys = Object.keys(ratiosMap);
                return (
                  <>
                    {RATIO_GROUPS.map((group) => {
                      const entries = group.keys
                        .filter((k) => ratiosMap[k] != null)
                        .map((k) => { usedKeys.add(k); return [k, ratiosMap[k]] as [string, string]; });
                      if (entries.length === 0) return null;
                      const VISUAL_PANELS: Record<string, ComponentType<{ ratiosMap: Record<string, string> }>> = {
                        Valuation: ValuationPanel,
                        "Returns & Margins": ReturnsPanel,
                        "Leverage & Debt": LeveragePanel,
                        Technicals: TechnicalsPanel,
                        "Ownership & Liquidity": OwnershipLiquidityPanel,
                      };
                      const Panel = VISUAL_PANELS[group.label];
                      if (Panel) {
                        return (
                          <div key={group.label}>
                            <p className="text-xs font-semibold uppercase tracking-widest text-chalk-300/40 mb-3">{group.label}</p>
                            <Panel ratiosMap={ratiosMap} />
                          </div>
                        );
                      }
                      return (
                        <div key={group.label}>
                          <p className="text-xs font-semibold uppercase tracking-widest text-chalk-300/40 mb-3">{group.label}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4">
                            {entries.map(([k, v]) => {
                              const tipKey = RATIO_TOOLTIP_KEY[k];
                              const tip = tipKey ? TOOLTIPS[tipKey] : undefined;
                              return (
                                <div key={k}>
                                  <p className="text-xs text-chalk-300/70 leading-tight flex items-center">
                                    {k}
                                    {tip && <Tooltip content={{ body: tip.body }} />}
                                  </p>
                                  <p className="num text-sm font-semibold text-chalk-100 mt-0.5">{v}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {(() => {
                      const remaining = allKeys.filter((k) => !usedKeys.has(k));
                      if (remaining.length === 0) return null;
                      return (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-chalk-300/40 mb-3">Other</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4">
                            {remaining.map((k) => {
                              const tipKey = RATIO_TOOLTIP_KEY[k];
                              const tip = tipKey ? TOOLTIPS[tipKey] : undefined;
                              return (
                                <div key={k}>
                                  <p className="text-xs text-chalk-300/70 leading-tight flex items-center">
                                    {k}
                                    {tip && <Tooltip content={{ body: tip.body }} />}
                                  </p>
                                  <p className="num text-sm font-semibold text-chalk-100 mt-0.5">{ratiosMap[k]}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Growth */}
        {mountedTabs.has("Growth") && growthTables && (
          <div className={clsx(currentTab !== "Growth" && "hidden")}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(growthTables).map(([title, rows]) => {
                const tipKey = GROWTH_TOOLTIP_KEY[title.toLowerCase()];
                const tip = tipKey ? TOOLTIPS[tipKey] : undefined;
                return (
                <div key={title} className="glass border-subtle rounded-2xl p-4">
                  <p className="text-xs font-semibold text-chalk-300 mb-2 flex items-center">
                    {title}
                    {tip && <Tooltip content={{ body: tip.body }} />}
                  </p>
                  <div className="space-y-1">
                    {Object.entries(rows).map(([period, value]) => (
                      <div key={period} className="flex justify-between text-xs">
                        <span className="text-chalk-300/70">{period}</span>
                        <span className={`num font-semibold ${parseFloat(value) >= 0 ? "text-accent" : "text-bad"}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Factors */}
        {mountedTabs.has("Factors") && factorBreakdown && factorBreakdown.length > 0 && (
          <div className={clsx(currentTab !== "Factors" && "hidden")}>
            <div className="glass border-subtle rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-ink-700/40">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold text-chalk-100">Factor Breakdown</span>
                  {rawTotal != null && (
                    <span className="text-xs text-chalk-300/60">{factorBreakdown.length} factors · raw score {rawTotal.toFixed(1)}/100</span>
                  )}
                </div>
                <p className="text-[11px] text-chalk-300/50 leading-relaxed max-w-2xl">
                  Every row is one input to the score - the exact metric, what it scored on a 0–1 scale, how much
                  weight that factor carries, the resulting points, and whether the underlying number is judged
                  on an absolute scale, against sector peers, or as a trend over time. See{" "}
                  <a href="/methodology#math" className="text-accent hover:underline">Scoring primitives</a> for how the 0–1 scores are computed.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-chalk-300/50 uppercase tracking-wider">
                    <tr className="border-b border-ink-700/40">
                      <th className="text-left px-4 py-2">Factor</th>
                      <th className="text-left px-4 py-2 hidden sm:table-cell">Category</th>
                      <th className="text-right px-4 py-2">
                        <span className="inline-flex items-center justify-end">
                          Score 0–1
                          <Tooltip content={{ body: "The factor's raw result mapped to a 0–1 scale by the scoring primitive (logistic/linUp/linDown/band) before weighting." }} />
                        </span>
                      </th>
                      <th className="text-right px-4 py-2">
                        <span className="inline-flex items-center justify-end">
                          Wt
                          <Tooltip content={{ body: "Maximum points this factor can contribute - its share of the category's total weight." }} />
                        </span>
                      </th>
                      <th className="text-right px-4 py-2">
                        <span className="inline-flex items-center justify-end">
                          Pts
                          <Tooltip content={{ body: "Score 0–1 × weight - the actual points this factor contributed to the raw total." }} />
                        </span>
                      </th>
                      <th className="text-left px-4 py-2 hidden md:table-cell">
                        <span className="inline-flex items-center">
                          Source
                          <Tooltip content={{ body: "absolute = judged against a fixed benchmark. relative = judged against sector peers. trend = judged on direction of change over time." }} />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-700/30">
                    {factorBreakdown.map((row, i) => (
                      <tr key={i} className="hover:bg-ink-800/20">
                        <td className="px-4 py-2">
                          <p className="text-chalk-100">{row.factor}</p>
                          {row.notes && (
                            <p className="text-chalk-300/50 mt-0.5 leading-tight max-w-xs hidden lg:block">{row.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-2 text-chalk-300/70 hidden sm:table-cell">{row.category}</td>
                        <td className="px-4 py-2 text-right num">
                          <span className={clsx(
                            row.score_01 >= 0.7 ? "text-accent" : row.score_01 >= 0.4 ? "text-warn" : "text-bad"
                          )}>
                            {row.score_01.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right num text-chalk-300">{row.weight}</td>
                        <td className={clsx(
                          "px-4 py-2 text-right num font-semibold",
                          row.points > row.weight * 0.7 ? "text-accent" : row.points > row.weight * 0.35 ? "text-warn" : "text-bad"
                        )}>
                          {row.points.toFixed(1)}
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell">
                          <span className={clsx(
                            "rounded px-1.5 py-0.5 text-xs",
                            row.source === "absolute" && "bg-ink-800 text-chalk-300/70",
                            row.source === "relative" && "bg-accent/10 text-accent/70",
                            row.source === "trend"    && "bg-warn/10 text-warn/70",
                          )}>
                            {row.source}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {assumptions && assumptions.length > 0 && (
                <div className="border-t border-ink-700/40 px-5 py-3">
                  <p className="text-xs font-semibold text-chalk-300/50 mb-2 uppercase tracking-wider">Assumptions &amp; fallbacks</p>
                  <ul className="space-y-1">
                    {assumptions.map((a, i) => (
                      <li key={i} className="text-xs text-chalk-300/60">· {a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
