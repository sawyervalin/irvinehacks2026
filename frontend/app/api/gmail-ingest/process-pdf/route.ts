import { NextResponse } from "next/server";
import { setLatestThreatResult } from "../../../../lib/threatResultStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let file: File | null = null;

  try {
    const formData = await request.formData();
    const maybeFile = formData.get("file");
    if (maybeFile instanceof File) {
      file = maybeFile;
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "BAD_FORM_DATA",
        message: "Invalid multipart form data."
      },
      { status: 400 }
    );
  }

  if (!file) {
    return NextResponse.json(
      {
        ok: false,
        code: "NO_FILE",
        message: "No PDF file provided."
      },
      { status: 400 }
    );
  }

  const pdfBackendUrl = process.env.DUMMY_PDF_BACKEND_URL || "http://localhost:8000/process-pdf";
  const backendForm = new FormData();
  backendForm.append("file", file, file.name || "upload.pdf");

  try {
    const backendResponse = await fetch(pdfBackendUrl, {
      method: "POST",
      body: backendForm
    });
    const contentType = backendResponse.headers.get("content-type") ?? "";
    if (backendResponse.ok && contentType.includes("application/json")) {
      const parsed = (await backendResponse.json()) as unknown;
      setLatestThreatResult({
        receivedAt: new Date().toISOString(),
        source: "process-pdf",
        backendResponse: parsed
      });
    }
  } catch {
    // Fail silently by design in this prototype.
  }

  return NextResponse.json({
    ok: true,
    attempted: true
  });
}
