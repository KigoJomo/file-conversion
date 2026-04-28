import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { ParsedDocument } from "./types";

const page = { width: 612, height: 792, margin: 48 };
const sheetPage = { width: 842, height: 595, margin: 24 };
const lineHeight = 14;
const maxLineLength = 92;
const tableFontSize = 7;
const tableLineHeight = 8.5;
const tablePadding = 3;

export async function renderPdf(document: ParsedDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  if (document.sourceType === "xlsx") {
    renderSpreadsheet(pdf, document, regular, bold);
    return pdf.save();
  }

  let current = pdf.addPage([page.width, page.height]);
  let y = page.height - page.margin;

  const drawLine = (text: string, size = 10, isBold = false) => {
    if (y < page.margin) {
      current = pdf.addPage([page.width, page.height]);
      y = page.height - page.margin;
    }
    current.drawText(text, {
      x: page.margin,
      y,
      size,
      font: isBold ? bold : regular,
      color: rgb(0.09, 0.09, 0.1),
    });
    y -= lineHeight + (size > 11 ? 4 : 0);
  };

  for (const section of document.sections) {
    drawLine(section.heading, 12, true);
    for (const line of section.lines.length ? section.lines : ["No extractable text found."]) {
      for (const wrapped of wrapText(line)) {
        drawLine(wrapped);
      }
    }
    y -= 8;
  }

  return pdf.save();
}

function renderSpreadsheet(
  pdf: PDFDocument,
  document: ParsedDocument,
  regular: PDFFont,
  bold: PDFFont,
) {
  for (const section of document.sections) {
    const rows = section.rows?.length ? section.rows : [[""]];
    const colWidths = getColumnWidths(rows);
    let current = pdf.addPage([sheetPage.width, sheetPage.height]);
    let y = sheetPage.height - sheetPage.margin;

    for (const [rowIndex, row] of rows.entries()) {
      const wrappedCells = row.map((cell, index) => wrapCellText(cell, colWidths[index]));
      const rowHeight = Math.max(...wrappedCells.map((cell) => cell.length), 1) * tableLineHeight + tablePadding * 2;

      if (y - rowHeight < sheetPage.margin) {
        current = pdf.addPage([sheetPage.width, sheetPage.height]);
        y = sheetPage.height - sheetPage.margin;
      }

      let x = sheetPage.margin;
      for (const [index, cellLines] of wrappedCells.entries()) {
        const width = colWidths[index];
        current.drawRectangle({
          x,
          y: y - rowHeight,
          width,
          height: rowHeight,
          borderColor: rgb(0.72, 0.72, 0.72),
          borderWidth: 0.45,
        });

        const font = rowIndex === 0 ? bold : regular;
        cellLines.slice(0, 4).forEach((line, lineIndex) => {
          current.drawText(line, {
            x: x + tablePadding,
            y: y - tablePadding - tableFontSize - lineIndex * tableLineHeight,
            size: tableFontSize,
            font,
            color: rgb(0.05, 0.05, 0.06),
          });
        });
        x += width;
      }
      y -= rowHeight;
    }
  }
}

function getColumnWidths(rows: string[][]): number[] {
  const width = Math.max(1, ...rows.map((row) => row.length));
  const available = sheetPage.width - sheetPage.margin * 2;
  const weights = Array.from({ length: width }, (_, index) =>
    Math.max(8, ...rows.map((row) => Math.min(36, (row[index] ?? "").length))),
  );
  const total = weights.reduce((sum, item) => sum + item, 0);

  return weights.map((weight) => (weight / total) * available);
}

function wrapCellText(value: string, width: number): string[] {
  const maxChars = Math.max(4, Math.floor((width - tablePadding * 2) / 3.8));
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return [""];

  const lines: string[] = [];
  let remaining = normalized;
  while (remaining.length > maxChars) {
    const breakAt = Math.max(remaining.lastIndexOf(" ", maxChars), maxChars);
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }

  return remaining ? [...lines, remaining] : lines;
}


export function wrapText(value: string): string[] {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLineLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  return line ? lines.concat(line) : [];
}
