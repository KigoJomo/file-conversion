import { describe, expect, it } from "vitest";
import { renderPdf, wrapText } from "@/lib/conversion/pdf";
import { getSupportedExtension } from "@/lib/conversion/types";

describe("conversion helpers", () => {
  it("detects supported extensions case-insensitively", () => {
    expect(getSupportedExtension("sales.XLSX")).toBe("xlsx");
    expect(getSupportedExtension("brief.docx")).toBe("docx");
    expect(getSupportedExtension("deck.pptx")).toBe("pptx");
    expect(getSupportedExtension("image.png")).toBeNull();
  });

  it("wraps long text into readable lines", () => {
    const lines = wrapText("one ".repeat(60));

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => line.length <= 92)).toBe(true);
  });

  it("renders a valid PDF", async () => {
    const bytes = await renderPdf({
      title: "Test conversion",
      sourceName: "sample.docx",
      sourceType: "docx",
      sections: [{ heading: "Text", lines: ["Hello from a document"] }],
    });

    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");
  });
});
