"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  LineChart,
  AreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { extractChartData } from "@/lib/company-data";
import type { ChartData } from "@/lib/company-data";

interface PeerInfo {
  name: string;
  symbol: string;
  ticker: string;
}

interface Props {
  primaryData: ChartData;
  primaryName: string;
  peers: PeerInfo[];
}

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#A855F7"];
const GRID = { strokeDasharray: "3 3", stroke: "#1A2233" };
const AXIS_STYLE = { fill: "#9FB0C8", fontSize: 11 };
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#0B1220",
    border: "1px solid #1A2233",
    borderRadius: 8,
    color: "#EEF2F7",
    fontSize: 12,
  },
  labelStyle: { color: "#9FB0C8" },
};

const fmtCr = (v: number) =>
  v >= 100000
    ? `${(v / 100000).toFixed(1)}L`
    : v >= 1000
    ? `${(v / 1000).toFixed(0)}K`
    : `${v}`;

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

const shortYear = (l: string) => {
  const m = l.match(/\d{4}/);
  return m ? `'${m[0].slice(2)}` : l;
};

const shortQuarter = (l: string) => {
  if (l.startsWith("Mar")) return `M'${l.slice(-2)}`;
  if (l.startsWith("Jun")) return `J'${l.slice(-2)}`;
  if (l.startsWith("Sep")) return `S'${l.slice(-2)}`;
  if (l.startsWith("Dec")) return `D'${l.slice(-2)}`;
  return shortYear(l);
};

function ChartPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-4">
      <p className="text-xs uppercase tracking-widest text-accent mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

export function FinancialCharts({ primaryData, primaryName, peers }: Props) {
  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);
  const [peerData, setPeerData] = useState<Record<string, ChartData>>({});
  const [loadingPeers, setLoadingPeers] = useState<Set<string>>(new Set());

  async function togglePeer(symbol: string) {
    if (selectedPeers.includes(symbol)) {
      setSelectedPeers((prev) => prev.filter((s) => s !== symbol));
      return;
    }
    if (selectedPeers.length >= 3) return;

    if (peerData[symbol]) {
      setSelectedPeers((prev) => [...prev, symbol]);
      return;
    }

    setLoadingPeers((prev) => new Set(prev).add(symbol));
    try {
      const res = await fetch(`/api/company/${symbol}`);
      if (res.ok) {
        const json = await res.json();
        const cd = extractChartData(json, symbol);
        setPeerData((prev) => ({ ...prev, [symbol]: cd }));
        setSelectedPeers((prev) => [...prev, symbol]);
      }
    } catch {
    } finally {
      setLoadingPeers((prev) => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
    }
  }

  const allCompanies = [
    { key: primaryData.company, data: primaryData, name: primaryName },
    ...selectedPeers
      .map((s) => ({ key: s, data: peerData[s], name: s }))
      .filter((c) => c.data),
  ];

  const unionAnnualLabels = [
    ...new Set(allCompanies.flatMap((c) => c.data.annualLabels)),
  ].sort();

  const annualChartRows = unionAnnualLabels.map((label) => {
    const row: Record<string, number | string | null> = { label: shortYear(label) };
    for (const { key, data } of allCompanies) {
      const i = data.annualLabels.indexOf(label);
      row[`${key}_sales`] = i >= 0 ? data.annualSales[i] : null;
      row[`${key}_profit`] = i >= 0 ? data.annualNetProfit[i] : null;
      row[`${key}_opm`] = i >= 0 ? data.annualOpm[i] : null;
      row[`${key}_roce`] = i >= 0 ? data.annualRoce[i] : null;
    }
    return row;
  });

  const bsChartRows = unionAnnualLabels.map((label) => {
    const row: Record<string, number | string | null> = { label: shortYear(label) };
    for (const { key, data } of allCompanies) {
      const i = data.bsLabels.indexOf(label);
      row[`${key}_equity`] = i >= 0 ? data.bsEquity[i] : null;
      row[`${key}_borrowings`] = i >= 0 ? data.bsBorrowings[i] : null;
    }
    return row;
  });

  const cfChartRows = unionAnnualLabels.map((label) => {
    const row: Record<string, number | string | null> = { label: shortYear(label) };
    for (const { key, data } of allCompanies) {
      const i = data.cfLabels.indexOf(label);
      row[`${key}_cfo`] = i >= 0 ? data.cfCfo[i] : null;
      row[`${key}_fcf`] = i >= 0 ? data.cfFcf[i] : null;
    }
    return row;
  });

  const qtChartRows = primaryData.quarterlyLabels.map((label, i) => ({
    label: shortQuarter(label),
    sales: primaryData.quarterlySales[i],
    profit: primaryData.quarterlyNetProfit[i],
    opm: primaryData.quarterlyOpm[i],
  }));

  const shChartRows = primaryData.shLabels.map((label, i) => ({
    label: shortQuarter(label),
    promoter: primaryData.shPromoter[i],
    fii: primaryData.shFii[i],
    dii: primaryData.shDii[i],
    public: primaryData.shPublic[i],
  }));

  const hasPeers = selectedPeers.length > 0;

  return (
    <div>
      {peers.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-xs text-chalk-300/70">
            Compare with sector peers:
          </span>
          {peers.map((p) => {
            const isSelected = selectedPeers.includes(p.symbol);
            const isLoading = loadingPeers.has(p.symbol);
            const isDisabled = !isSelected && selectedPeers.length >= 3;
            return (
              <button
                key={p.symbol}
                onClick={() => togglePeer(p.symbol)}
                disabled={isDisabled}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : isDisabled
                    ? "border-ink-700/30 text-chalk-300/30 cursor-not-allowed"
                    : "border-ink-700/60 text-chalk-300 hover:border-accent/30 hover:text-chalk-100"
                }`}
              >
                {isLoading && (
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                )}
                {p.symbol}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel title="Annual Revenue & Net Profit">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={annualChartRows}>
              <CartesianGrid {...GRID} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="sales"
                tickFormatter={fmtCr}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <YAxis
                yAxisId="profit"
                orientation="right"
                tickFormatter={fmtCr}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number) => fmtCr(value)}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#9FB0C8" }}
              />
              {!hasPeers ? (
                <>
                  <Bar
                    yAxisId="sales"
                    dataKey={`${primaryData.company}_sales`}
                    name="Sales"
                    fill="#10B981"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    yAxisId="profit"
                    dataKey={`${primaryData.company}_profit`}
                    name="Net Profit"
                    fill="#3B82F6"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={24}
                  />
                </>
              ) : (
                allCompanies.map(({ key, name }, idx) => (
                  <>
                    <Bar
                      key={`${key}_sales_bar`}
                      yAxisId="sales"
                      dataKey={`${key}_sales`}
                      name={`${name} Sales`}
                      fill={COLORS[idx % COLORS.length]}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={16}
                    />
                    <Line
                      key={`${key}_profit_line`}
                      yAxisId="profit"
                      type="monotone"
                      dataKey={`${key}_profit`}
                      name={`${name} Net Profit`}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray={idx === 0 ? undefined : "4 2"}
                    />
                  </>
                ))
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Margin Trends: OPM % & ROCE %">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={annualChartRows}>
              <CartesianGrid {...GRID} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={fmtPct}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number) => fmtPct(value)}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9FB0C8" }} />
              {allCompanies.map(({ key, name }, idx) => (
                <>
                  <Line
                    key={`${key}_opm`}
                    type="monotone"
                    dataKey={`${key}_opm`}
                    name={`${name} OPM%`}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    key={`${key}_roce`}
                    type="monotone"
                    dataKey={`${key}_roce`}
                    name={`${name} ROCE%`}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={false}
                  />
                </>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Quarterly Revenue & Net Profit">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={qtChartRows}>
              <CartesianGrid {...GRID} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={fmtCr}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number) => fmtCr(value)}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9FB0C8" }} />
              <Bar
                dataKey="sales"
                name="Sales"
                fill="#10B981"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="profit"
                name="Net Profit"
                fill="#3B82F6"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Balance Sheet: Equity vs Borrowings">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bsChartRows}>
              <CartesianGrid {...GRID} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={fmtCr}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number) => fmtCr(value)}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9FB0C8" }} />
              {allCompanies.map(({ key, name }, idx) => (
                <>
                  <Bar
                    key={`${key}_equity`}
                    dataKey={`${key}_equity`}
                    name={`${name} Equity`}
                    stackId={key}
                    fill={COLORS[idx % COLORS.length]}
                    radius={[0, 0, 0, 0]}
                    maxBarSize={20}
                  />
                  <Bar
                    key={`${key}_borrowings`}
                    dataKey={`${key}_borrowings`}
                    name={`${name} Borrowings`}
                    stackId={key}
                    fill="#F87171"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={20}
                  />
                </>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Cash Flow: CFO vs Free Cash Flow">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={cfChartRows}>
              <CartesianGrid {...GRID} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={fmtCr}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number) => fmtCr(value)}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9FB0C8" }} />
              {!hasPeers ? (
                <>
                  <Bar
                    dataKey={`${primaryData.company}_cfo`}
                    name="CFO"
                    fill="#10B981"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={20}
                  />
                  <Bar
                    dataKey={`${primaryData.company}_fcf`}
                    name="Free Cash Flow"
                    fill="#3B82F6"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={20}
                  />
                </>
              ) : (
                allCompanies.map(({ key, name }, idx) => (
                  <>
                    <Bar
                      key={`${key}_cfo_bar`}
                      dataKey={`${key}_cfo`}
                      name={`${name} CFO`}
                      fill={COLORS[idx % COLORS.length]}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={16}
                    />
                    <Line
                      key={`${key}_fcf_line`}
                      type="monotone"
                      dataKey={`${key}_fcf`}
                      name={`${name} FCF`}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      dot={false}
                    />
                  </>
                ))
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Shareholding Pattern">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={shChartRows}>
              <CartesianGrid {...GRID} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={fmtPct}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number) => fmtPct(value)}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9FB0C8" }} />
              <Area
                type="monotone"
                dataKey="promoter"
                name="Promoters"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="fii"
                name="FIIs"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="dii"
                name="DIIs"
                stackId="1"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="public"
                name="Public"
                stackId="1"
                stroke="#A855F7"
                fill="#A855F7"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </div>
  );
}
