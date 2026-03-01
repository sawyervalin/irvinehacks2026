import { NextRequest, NextResponse } from "next/server";
import { setLatestBatch, type GmailIngestPayload } from "../../../lib/gmailIngestStore";

export const runtime = "nodejs";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-extension-api-key"
  };
}

function isValidPayload(value: unknown): value is GmailIngestPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<GmailIngestPayload>;
  if (!payload.data || typeof payload.data !== "object") {
    return false;
  }

  return (
    typeof payload.source === "string" &&
    typeof payload.ingestedAt === "string" &&
    typeof payload.data.count === "number" &&
    Array.isArray(payload.data.messages)
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function POST(request: NextRequest) {
  const expectedApiKey = process.env.EXTENSION_API_KEY || "dev-extension-key-change-me";
  const apiKey = request.headers.get("x-extension-api-key");

  if (!apiKey || apiKey !== expectedApiKey) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", message: "Invalid extension API key." },
      { status: 401, headers: corsHeaders() }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_JSON", message: "Invalid JSON body." },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid ingest payload shape." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const batch = setLatestBatch(body);
  return NextResponse.json(
    {
      ok: true,
      batchId: batch.batchId,
      ingestedCount: batch.ingestedCount
    },
    { status: 200, headers: corsHeaders() }
  );
}
