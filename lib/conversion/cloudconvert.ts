import CloudConvert from "cloudconvert";
import { getSupportedExtension, type ConversionResult } from "./types";

const apiKey = process.env.CLOUDCONVERT_API_KEY;
const useSandbox = process.env.CLOUDCONVERT_SANDBOX === "true";

export function canUseCloudConvert(): boolean {
  return Boolean(apiKey);
}
export async function convertWithCloudConvert(file: File): Promise<ConversionResult> {
  const sourceType = getSupportedExtension(file.name);

  if (!sourceType) {
    throw new Error("Only .xlsx, .docx, and .pptx files are supported.");
  }

  if (!apiKey) {
    throw new Error("CloudConvert is not configured. Set CLOUDCONVERT_API_KEY in the deployment environment.");
  }

  const cloudConvert = new CloudConvert(apiKey, useSandbox);
  const job = await cloudConvert.jobs.create({
    tasks: {
      "import-file": {
        operation: "import/upload",
      },
      "convert-file": {
        operation: "convert",
        input: "import-file",
        input_format: sourceType,
        output_format: "pdf",
        filename: `${stripExtension(file.name)}.pdf`,
      },
      "export-file": {
        operation: "export/url",
        input: "convert-file",
        inline: false,
        archive_multiple_files: false,
      },
    },
  });

  const uploadTask = job.tasks.find((task) => task.name === "import-file");
  if (!uploadTask) throw new Error("CloudConvert upload task was not created.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  await cloudConvert.tasks.upload(uploadTask, bytes, file.name, file.size);

  const completed = await cloudConvert.jobs.wait(job.id);
  const exported = cloudConvert.jobs.getExportUrls(completed)[0];

  if (!exported?.url) {
    throw new Error("CloudConvert did not return a converted PDF.");
  }

  const response = await fetch(exported.url);
  if (!response.ok) {
    throw new Error("Unable to download the converted PDF from CloudConvert.");
  }

  return {
    fileName: exported.filename || `${stripExtension(file.name)}.pdf`,
    bytes: new Uint8Array(await response.arrayBuffer()),
  };
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}
