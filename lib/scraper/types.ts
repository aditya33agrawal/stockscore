export interface Session {
  cookies: string;
  csrfToken: string;
}

export interface Announcement {
  title: string;
  date: string;
  summary: string;
  url: string;
}

export interface ChartDataset {
  label: string;
  data: (number | null)[];
}

export interface ChartSeries {
  labels: string[];
  datasets: ChartDataset[];
  metric_query: string;
}

export interface DocumentEntry {
  label: string;
  url: string;
}

export interface Documents {
  annual_reports: DocumentEntry[];
  concall_ai_summaries: DocumentEntry[];
}

export interface RawCompanyData {
  name: string;
  symbol: string;
  currentPrice: string;
  companyId: string;
  warehouseId: string;
  consolidated: boolean;
  ratios: Record<string, string>;
  about: string;
  keyPoints: string;
  prosCons: { pros: string[]; cons: string[] };
  growthTables: Record<string, Record<string, string>>;
  peers: string | null;
  quarters: string | null;
  profitLoss: string | null;
  balanceSheet: string | null;
  cashFlow: string | null;
  ratiosTable: string | null;
  shareholding: string | null;
  announcementsImportant: Announcement[];
  announcementsRecent: Announcement[];
  chartData: Record<string, ChartSeries | null>;
  documents: Documents;
}
