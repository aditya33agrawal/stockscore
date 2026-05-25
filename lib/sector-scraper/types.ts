export interface SectorRow {
  sno: number;
  name: string;
  slug: string;           // extracted from href e.g. /market/IN02/IN0201/.../
  url: string;            // full href
  companyCount: number | null;
  totalMarketCap: number | null;     // in Cr
  medianMarketCap: number | null;    // in Cr
  medianPE: number | null;
  wtdAvgSalesGrowth: number | null;  // %
  wtdAvgOPM: number | null;          // %
  wtdAvgROCE: number | null;         // %
  median1YReturn: number | null;     // %
  // raw strings for display
  raw: {
    totalMarketCap: string;
    medianMarketCap: string;
    medianPE: string;
    wtdAvgSalesGrowth: string;
    wtdAvgOPM: string;
    wtdAvgROCE: string;
    median1YReturn: string;
  };
}
