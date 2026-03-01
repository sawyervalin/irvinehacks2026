import { NextResponse } from "next/server";
import { getLatestBatch } from "../../../../lib/gmailIngestStore";

export const runtime = "nodejs";

export async function POST() {
  const latest = getLatestBatch();

  if (!latest) {
    return NextResponse.json(
      {
        ok: false,
        code: "NO_DATA",
        message: "No ingested Gmail data available to process."
      },
      { status: 400 }
    );
  }

  const dummyBackendUrl = process.env.DUMMY_BACKEND_URL || "http://localhost:8000/dummy";
  try {
    await fetch(dummyBackendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        batchId: latest.batchId,
        payload: latest.payload
      })
    });
  } catch {
    // Fail silently by design in this prototype.
  }

  return NextResponse.json({
    ok: true,
    attempted: true
  });
}
