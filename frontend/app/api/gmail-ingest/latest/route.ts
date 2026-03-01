import { NextResponse } from "next/server";
import { getLatestBatch } from "../../../../lib/gmailIngestStore";

export const runtime = "nodejs";

export async function GET() {
  const latest = getLatestBatch();

  if (!latest) {
    return NextResponse.json({
      ok: true,
      hasData: false,
      ingestedCount: 0,
      ingestedAt: null,
      batchId: null
    });
  }

  return NextResponse.json({
    ok: true,
    hasData: true,
    ingestedCount: latest.ingestedCount,
    ingestedAt: latest.ingestedAt,
    batchId: latest.batchId
  });
}
