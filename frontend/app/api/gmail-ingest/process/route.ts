import { NextResponse } from "next/server";
import { getLatestBatch } from "../../../../lib/gmailIngestStore";
import { setLatestThreatResult } from "../../../../lib/threatResultStore";

export const runtime = "nodejs";

function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
    let overridePayload: Record<string, unknown> | null = null;

    try {
        const body = (await request.json()) as unknown;
        if (isObject(body) && isObject(body.payload)) {
            overridePayload = body.payload;
        }
    } catch {
        // Empty/non-JSON body is valid; fallback to latest ingested batch.
    }

    const latest = getLatestBatch();

    if (!overridePayload && !latest) {
        return NextResponse.json(
            {
                ok: false,
                code: "NO_DATA",
                message: "No ingested Gmail data available to process."
            },
            { status: 400 }
        );
    }

    const requestBody = overridePayload
        ? {
              batchId: `manual-${Date.now()}`,
              payload: overridePayload
          }
        : {
              batchId: latest!.batchId,
              payload: latest!.payload
          };

    const dummyBackendUrl = process.env.DUMMY_BACKEND_URL || "http://localhost:8000/process";
    try {
        const backendResponse = await fetch(dummyBackendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
        const contentType = backendResponse.headers.get("content-type") ?? "";
        if (backendResponse.ok && contentType.includes("application/json")) {
            const parsed = (await backendResponse.json()) as unknown;
            setLatestThreatResult({
                receivedAt: new Date().toISOString(),
                source: "process",
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
