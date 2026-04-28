import mammoth from "mammoth";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import type { ParsedDocument, SupportedExtension } from "./types";

export async function parseOfficeFile(
  buffer: ArrayBuffer,
  sourceName: string,
  sourceType: SupportedExtension,
): Promise<ParsedDocument> {
  if (sourceType === "xlsx") return parseWorkbook(buffer, sourceName);
  if (sourceType === "docx") return parseWord(buffer, sourceName);
  return parsePowerPoint(buffer, sourceName);
}

function parseWorkbook(buffer: ArrayBuffer, sourceName: string): ParsedDocument {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sections = workbook.SheetNames.slice(0, 8).map((name) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
      blankrows: false,
      defval: "",
      header: 1,
    });
    const formattedRows = normalizeRows(rows.slice(0, 120).map((row) => row.map(formatCell)));

    return {
      heading: name,
      lines: [],
      rows: formattedRows,
    };
  });
  return { title: "Spreadsheet conversion", sourceName, sourceType: "xlsx", sections };
}

async function parseWord(buffer: ArrayBuffer, sourceName: string): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  const lines = result.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    title: "Document conversion",
    sourceName,
    sourceType: "docx",
    sections: [{ heading: "Document text", lines }],
  };
}

async function parsePowerPoint(buffer: ArrayBuffer, sourceName: string): Promise<ParsedDocument> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort(sortSlides);
  const sections = await Promise.all(
    slideFiles.map(async (name, index) => ({
      heading: `Slide ${index + 1}`,
      lines: extractXmlText(await zip.files[name].async("text")),
    })),
  );
  return { title: "Presentation conversion", sourceName, sourceType: "pptx", sections };
}

function extractXmlText(xml: string): string[] {
  return Array.from(xml.matchAll(/<a:t>(.*?)<\/a:t>/g), (match) =>
    decodeXml(match[1]).trim(),
  ).filter(Boolean);
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function formatCell(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "");
}

function normalizeRows(rows: string[][]): string[][] {
  const width = Math.max(0, ...rows.map((row) => row.length));
  return rows.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ""));
}

function sortSlides(left: string, right: string): number {
  return Number(left.match(/\d+/)?.[0] ?? 0) - Number(right.match(/\d+/)?.[0] ?? 0);
}
