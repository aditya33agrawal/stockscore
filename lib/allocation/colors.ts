// Ink Wash categorical ramp - muted slate / violet / taupe / amber tones that
// harmonize with the cream canvas. Deliberately avoids green/red (reserved for
// value verdicts) so allocation segments are never mistaken for sentiment.
export const COLORS: Record<string, string> = {
  equity: "#6D8196", // slate (brand)
  direct_equity: "#56687C", // deep slate
  index_fund: "#7E92A6",
  large_cap: "#8499AE",
  flexi_cap: "#90A4B8",
  multi_asset: "#9CAFC2",
  mid_cap: "#5E7790",
  small_cap: "#4F6982",
  sector_fund: "#A8BAC9",
  foreign: "#B4C5D2", // light slate
  debt: "#7C7196", // muted violet
  debt_fund: "#7C7196",
  bonds: "#9A8C7C", // warm taupe
  corporate_bonds: "#A4977F",
  govt_bills: "#9A8C7C",
  other_bonds: "#8F7F6C",
  metal: "#B8862B", // amber
  gold: "#B8862B",
  silver: "#C9A86A",
  real_estate: "#A8755E", // terracotta
  cash: "#C9BBA6", // pale taupe
};
