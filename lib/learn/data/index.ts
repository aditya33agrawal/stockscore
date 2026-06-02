import type { MetricEntry } from "../types";
import { valuationMetrics } from "./valuation";
import { profitabilityMetrics } from "./profitability";
import { growthMetrics } from "./growth";
import { balanceSheetMetrics } from "./balance-sheet";
import { cashFlowMetrics } from "./cash-flow";
import { shareholdingMetrics } from "./shareholding";
import { technicalMetrics } from "./technical";
import { sectorMetrics } from "./sector";

export const metrics: MetricEntry[] = [
  ...valuationMetrics,
  ...profitabilityMetrics,
  ...growthMetrics,
  ...balanceSheetMetrics,
  ...cashFlowMetrics,
  ...shareholdingMetrics,
  ...technicalMetrics,
  ...sectorMetrics,
];

export function getMetricById(id: string): MetricEntry | undefined {
  return metrics.find((m) => m.id === id);
}
