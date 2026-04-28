import { convertOfficeFile } from "@/lib/conversion/convert";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Upload a file to convert." }, { status: 400 });
  }

  try {
    const result = await convertOfficeFile(file);
    return new Response(result.bytes as BodyInit, {
      headers: {
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
