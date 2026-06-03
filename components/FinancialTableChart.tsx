"use client";

import {
  ResponsiveContainer,
  ComposedChart,
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
import { parseFinancialCSV, toNum, shortLabel } from "@/lib/company-data";

interface Props {
  csv: string | null;
  title: string;
}

const COLORS = ["#3F7A52", "#6D8196", "#B8862B", "#9C6FD4", "#B0524E"];
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

const fmtNum = (v: number) =>
  v >= 100000
    ? `${(v / 100000).toFixed(1)}L`
    : v >= 1000
    ? `${(v / 1000).toFixed(0)}K`
    : Math.abs(v) >= 100
    ? `${v.toFixed(0)}`
    : `${v.toFixed(1)}`;

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

// Chart spec per table: primary rows (left axis) + optional secondary row (right axis as line, e.g. %)
interface ChartSpec {
  primary: string[]; // row labels to plot on left axis
  secondary?: string; // row label to plot on right axis as line
  primaryType: "bar" | "line";
  unit: "cr" | "pct" | "days" | "num";
  stacked?: boolean;
  areaPct?: boolean; // shareholding-style stacked area %
}

const SPECS: Record<string, ChartSpec> = {
  "Quarterly Results": {
    primary: ["Sales", "Operating Profit", "Net Profit"],
    secondary: "OPM %",
    primaryType: "bar",
    unit: "cr",
  },
  "Profit & Loss": {
    primary: ["Sales", "Operating Profit", "Net Profit"],
    secondary: "OPM %",
    primaryType: "bar",
    unit: "cr",
  },
  "Balance Sheet": {
    primary: ["Reserves", "Borrowings", "Fixed Assets", "Investments"],
    primaryType: "line",
    unit: "cr",
  },
  "Cash Flow": {
    primary: [
      "Cash from Operating Activity",
      "Cash from Investing Activity",
      "Cash from Financing Activity",
      "Net Cash Flow",
    ],
    primaryType: "bar",
    unit: "cr",
  },
  "Annual Ratios": {
    primary: ["Debtor Days", "Inventory Days", "Days Payable", "Cash Conversion Cycle"],
    secondary: "ROCE %",
    primaryType: "line",
    unit: "days",
  },
  "Shareholding Pattern": {
    primary: ["Promoters", "FIIs", "DIIs", "Government", "Public"],
    primaryType: "line",
    unit: "pct",
    areaPct: true,
  },
};

export function FinancialTableChart({ csv, title }: Props) {
  const spec = SPECS[title];
  if (!csv || !spec) return null;

  const { headers, rowMap } = parseFinancialCSV(csv);
  if (headers.length === 0) return null;

  // Build data rows
  const data = headers.map((h, i) => {
    const row: Record<string, number | string | null> = { label: shortLabel(h) };
    for (const key of spec.primary) {
      const v = rowMap[key]?.[i];
      row[key] = v != null ? toNum(v) : null;
    }
    if (spec.secondary) {
      const v = rowMap[spec.secondary]?.[i];
      row[spec.secondary] = v != null ? toNum(v) : null;
    }
    return row;
  });

  // Skip if no usable data across the picked rows
  const hasAny = spec.primary.some((k) =>
    data.some((r) => r[k] != null && r[k] !== "")
  );
  if (!hasAny) return null;

  const primaryFmt = spec.unit === "pct" ? fmtPct : fmtNum;
  const tooltipFmt = (value: number, name: string) => {
    if (name === spec.secondary) return fmtPct(value);
    return spec.unit === "pct" ? fmtPct(value) : fmtNum(value);
  };

  return (
    <div className="px-5 py-4 border-b border-ink-700/40">
      <ResponsiveContainer width="100%" height={220}>
        {spec.areaPct ? (
          <AreaChart data={data}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={fmtPct}
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={44}
              domain={[0, 100]}
            />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmtPct(v)} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9FB0C8" }} />
            {spec.primary.map((key, idx) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stackId="1"
                stroke={COLORS[idx % COLORS.length]}
                fill={COLORS[idx % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        ) : spec.primaryType === "bar" ? (
          <ComposedChart data={data}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              yAxisId="L"
              tickFormatter={primaryFmt}
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            {spec.secondary && (
              <YAxis
                yAxisId="R"
                orientation="right"
                tickFormatter={fmtPct}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={40}
              />
            )}
            <Tooltip {...TOOLTIP_STYLE} formatter={tooltipFmt} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9FB0C8" }} />
            {spec.primary.map((key, idx) => (
              <Bar
                key={key}
                yAxisId="L"
                dataKey={key}
                name={key}
                fill={COLORS[idx % COLORS.length]}
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              />
            ))}
            {spec.secondary && (
              <Line
                yAxisId="R"
                type="monotone"
                dataKey={spec.secondary}
                name={spec.secondary}
                stroke="#B8862B"
                strokeWidth={2}
                dot={{ r: 3, fill: "#B8862B" }}
                connectNulls
              />
            )}
          </ComposedChart>
        ) : (
          <ComposedChart data={data}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              yAxisId="L"
              tickFormatter={primaryFmt}
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            {spec.secondary && (
              <YAxis
                yAxisId="R"
                orientation="right"
                tickFormatter={fmtPct}
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={40}
              />
            )}
            <Tooltip {...TOOLTIP_STYLE} formatter={tooltipFmt} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9FB0C8" }} />
            {spec.primary.map((key, idx) => (
              <Line
                key={key}
                yAxisId="L"
                type="monotone"
                dataKey={key}
                name={key}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
            {spec.secondary && (
              <Line
                yAxisId="R"
                type="monotone"
                dataKey={spec.secondary}
                name={spec.secondary}
                stroke="#B8862B"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                connectNulls
              />
            )}
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
