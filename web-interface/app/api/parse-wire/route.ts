import { NextRequest, NextResponse } from "next/server";
import { parseWithGemini } from "@/lib/gemini";
import { generateSafetyReport } from "@/lib/report";
import type { UserProfile } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_text, user_profile } = body as {
      document_text?: unknown;
      user_profile?: UserProfile | null;
    };

    if (!document_text || typeof document_text !== "string" || !document_text.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid document_text field." },
        { status: 400 }
      );
    }

    const parsed = await parseWithGemini(document_text, user_profile ?? null);
    const safety_report = await generateSafetyReport(parsed);

    return NextResponse.json({ ...parsed, safety_report });
  } catch (err) {
    console.error("[parse-wire] error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
