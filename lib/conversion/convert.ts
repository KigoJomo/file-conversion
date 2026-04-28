import { getSupportedExtension, type ConversionResult } from "./types";
import { convertWithCloudConvert } from "./cloudconvert";

const maxBytes = 15 * 1024 * 1024;

export async function convertOfficeFile(file: File): Promise<ConversionResult> {
  const sourceType = getSupportedExtension(file.name);

  if (!sourceType) {
    throw new Error("Only .xlsx, .docx, and .pptx files are supported.");
  }

  if (file.size > maxBytes) {
    throw new Error("Files must be 15MB or smaller.");
  }

  return convertWithCloudConvert(file);
}
