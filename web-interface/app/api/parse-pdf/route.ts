import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Path to wire_pdf_parser.py — one directory above the Next.js project root.
const PARSER_SCRIPT = join(process.cwd(), "..", "wire_pdf_parser.py");

async function runPython(args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("python3", [PARSER_SCRIPT, ...args], {
      timeout: 90_000,
    });
    return stdout;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("ENOENT")) {
      const { stdout } = await execFileAsync("python", [PARSER_SCRIPT, ...args], {
        timeout: 90_000,
      });
      return stdout;
    }
    throw e;
  }
}

export async function POST(request: NextRequest) {
  const tmpPdf  = join(tmpdir(), `wire-${randomUUID()}.pdf`);
  const tmpText = join(tmpdir(), `wire-${randomUUID()}.txt`);
  let usedPdf  = false;
  let usedText = false;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;

    let stdout: string;

    if (file) {
      // ── PDF path ──────────────────────────────────────────────────────────
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(tmpPdf, buffer);
      usedPdf = true;
      stdout = await runPython([tmpPdf]);
    } else if (text && text.trim()) {
      // ── Raw-text path ─────────────────────────────────────────────────────
      await writeFile(tmpText, text, "utf8");
      usedText = true;
      stdout = await runPython(["--text-file", tmpText]);
    } else {
      return NextResponse.json(
        { error: "Provide either a PDF file or pasted text." },
        { status: 400 }
      );
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[parse-pdf] error:", err);
    return NextResponse.json(
      { error: "Failed to parse document.", details: String(err) },
      { status: 500 }
    );
  } finally {
    if (usedPdf)  await unlink(tmpPdf).catch(() => {});
    if (usedText) await unlink(tmpText).catch(() => {});
  }
}
