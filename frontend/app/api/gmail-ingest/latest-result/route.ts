import { NextResponse } from "next/server";
import { clearLatestThreatResult, getLatestThreatResult } from "../../../../lib/threatResultStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
  };
}

export async function GET() {
  const latest = getLatestThreatResult();
  if (!latest) {
    return NextResponse.json(
      {
        ok: true,
        hasData: false,
        result: null
      },
      { headers: noStoreHeaders() }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      hasData: true,
      result: latest
    },
    { headers: noStoreHeaders() }
  );
}

export async function DELETE() {
  clearLatestThreatResult();
  return NextResponse.json(
    {
      ok: true,
      cleared: true
    },
    { headers: noStoreHeaders() }
  );
}
