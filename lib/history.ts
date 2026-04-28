export type ConversionHistoryItem = {
  id: string;
  sourceName: string;
  outputName: string;
  convertedAt: string;
};

const key = "file-conversion.history";
const limit = 6;

export function readHistory(): ConversionHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, limit) : [];
  } catch {
    return [];
  }
}

export function writeHistory(items: ConversionHistoryItem[]): void {
  window.localStorage.setItem(key, JSON.stringify(items.slice(0, limit)));
}
