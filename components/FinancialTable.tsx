import { parseFinancialCSV, shortLabel } from "@/lib/company-data";
import { FinancialTableChart } from "./FinancialTableChart";
import { Tooltip } from "./Tooltip";

interface Props {
  csv: string | null;
  title?: string;
}

// Keyed by normalised (lowercase, trailing "+"/whitespace stripped) row label
// from Screener.in's raw CSV exports - covers the line items that recur
// across quarterly results, P&L, balance sheet, cash flow, and shareholding.
const LINE_ITEM_TOOLTIPS: Record<string, string> = {
  sales: "Total revenue from operations for the period - the top line before any costs are deducted.",
  expenses: "Total operating costs incurred to generate the sales above - raw materials, employee cost, other expenses.",
  "operating profit": "Sales minus operating expenses, before interest, tax, depreciation and other income - the core profit from running the business.",
  "opm %": "Operating Profit ÷ Sales. The share of every rupee of revenue that survives the cost of running the business.",
  "other income": "Income outside the core business - interest on deposits, dividends received, asset sale gains. Best kept small relative to operating profit.",
  interest: "Interest paid on borrowings for the period - higher leverage means a bigger bite taken out of profit before tax.",
  depreciation: "Non-cash charge that spreads the cost of fixed assets over their useful life - reduces accounting profit without an actual cash outflow.",
  "profit before tax": "Operating profit plus other income, minus interest and depreciation - profit before the taxman's share.",
  tax: "Income tax provided for the period, as a percentage of/against profit before tax.",
  "net profit": "The bottom line - profit after all expenses, interest, depreciation and tax. What's left for shareholders.",
  eps: "Earnings Per Share - net profit divided by the number of outstanding shares. The per-share lens on profitability.",
  "dividend payout %": "Share of net profit paid out as dividends rather than retained for growth or debt repayment.",
  "equity share capital": "Face value of all issued shares - changes here usually signal a fresh issue, buyback, or stock split/bonus.",
  reserves: "Accumulated retained earnings and other reserves - the equity base built up by the business over time.",
  borrowings: "Total debt - secured and unsecured loans - owed by the company.",
  "other liabilities": "Trade payables, provisions and other obligations not classified as borrowings.",
  "total liabilities": "Sum of equity, reserves, borrowings and other liabilities - mirrors total assets on the balance sheet.",
  "fixed assets": "Net value of property, plant, equipment and other long-lived assets used to run the business.",
  cwip: "Capital Work in Progress - money spent on assets still under construction, not yet generating revenue.",
  investments: "Funds parked in other companies, mutual funds or securities rather than the core operating business.",
  "other assets": "Inventory, receivables, cash and other current/non-current assets not classified above.",
  "total assets": "Sum of all assets - fixed assets, investments and other assets. Mirrors total liabilities + equity.",
  "cash from operating activity": "Cash generated purely from running the business - the cleanest read on whether reported profit is real cash.",
  "cash from investing activity": "Cash spent on or received from buying/selling fixed assets and investments - usually negative for a growing business.",
  "cash from financing activity": "Cash flows from raising or repaying debt/equity and paying dividends.",
  "net cash flow": "Sum of operating, investing and financing cash flows - the net change in the company's cash balance for the period.",
  promoters: "Percentage of shares held by founders / the controlling shareholder group.",
  fiis: "Percentage of shares held by Foreign Institutional Investors.",
  diis: "Percentage of shares held by Domestic Institutional Investors - mutual funds, insurers, banks.",
  government: "Percentage of shares held by the Government of India or state governments.",
  public: "Percentage of shares held by retail and other public (non-institutional) investors.",
  "no. of shareholders": "Total count of unique shareholders on record - a rising count often reflects broadening retail interest.",
};

function lineItemTooltip(label: string): string | undefined {
  const key = label.replace(/\+\s*$/, "").trim().toLowerCase();
  return LINE_ITEM_TOOLTIPS[key];
}

export function FinancialTable({ csv, title }: Props) {
  if (!csv) {
    return (
      <div className="px-5 py-4 text-sm text-chalk-300/60">
        Data unavailable
      </div>
    );
  }

  const { headers, rowMap } = parseFinancialCSV(csv);
  const rows = Object.entries(rowMap);

  if (rows.length === 0) {
    return (
      <div className="px-5 py-4 text-sm text-chalk-300/60">
        Data unavailable
      </div>
    );
  }

  return (
    <div>
      {title && <FinancialTableChart csv={csv} title={title} />}
      <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-ink-800/60">
            <th className="sticky left-0 z-10 bg-ink-800/90 px-4 py-2.5 text-left font-semibold text-chalk-300 whitespace-nowrap border-r border-ink-700/40 min-w-[160px]">
              &nbsp;
            </th>
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-right font-semibold text-chalk-300 whitespace-nowrap"
                title={h}
              >
                {shortLabel(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, values], idx) => (
            <tr
              key={label}
              className={idx % 2 === 0 ? "bg-ink-900/60" : "bg-ink-800/40"}
            >
              <td className="sticky left-0 z-10 bg-inherit px-4 py-2 font-medium text-chalk-100 whitespace-nowrap border-r border-ink-700/40">
                <span className="inline-flex items-center">
                  {label}
                  {lineItemTooltip(label) && <Tooltip content={{ body: lineItemTooltip(label)! }} />}
                </span>
              </td>
              {headers.map((_, colIdx) => (
                <td
                  key={colIdx}
                  className="px-3 py-2 text-right font-mono text-chalk-300 whitespace-nowrap"
                >
                  {values[colIdx] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
