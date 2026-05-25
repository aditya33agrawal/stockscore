import { parseFinancialCSV, shortLabel } from "@/lib/company-data";
import { FinancialTableChart } from "./FinancialTableChart";

interface Props {
  csv: string | null;
  title?: string;
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
                {label}
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
