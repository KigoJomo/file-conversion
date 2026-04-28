export const supportedExtensions = ["xlsx", "docx", "pptx"] as const;

export type SupportedExtension = (typeof supportedExtensions)[number];

export type ParsedDocument = {
  title: string;
  sourceName: string;
  sourceType: SupportedExtension;
  sections: Array<{
    heading: string;
    lines: string[];
    rows?: string[][];
  }>;
};

export type ConversionResult = {
  fileName: string;
  bytes: Uint8Array;
};

export function getSupportedExtension(fileName: string): SupportedExtension | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return supportedExtensions.find((item) => item === extension) ?? null;
}
