import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { SectorData, SectorIndexEntry } from "./types";

export { scoreColor, scoreBg, pointsColor, formatDate } from "./format";

const DATA_DIR = path.join(process.cwd(), "public", "data");

export async function loadSectorIndex(): Promise<SectorIndexEntry[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, "sectors.json"), "utf8");
  return JSON.parse(raw) as SectorIndexEntry[];
}

export async function loadSector(slug: string): Promise<SectorData | null> {
  try {
    const raw = await fs.readFile(
      path.join(DATA_DIR, "sectors", `${slug}.json`),
      "utf8",
    );
    return JSON.parse(raw) as SectorData;
  } catch {
    return null;
  }
}

export async function allSectorSlugs(): Promise<string[]> {
  const idx = await loadSectorIndex();
  return idx.map((s) => s.slug);
}
