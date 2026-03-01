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

export async function POST(request: NextRequest) {
  const tmpPath = join(tmpdir(), `wire-${randomUUID()}.pdf`);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Write the uploaded PDF to a temp file so the Python script can read it.
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tmpPath, buffer);

    // Try python3 first, fall back to python.
    let stdout: string;
    try {
      ({ stdout } = await execFileAsync("python3", [PARSER_SCRIPT, tmpPath], {
        timeout: 30_000,
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("ENOENT")) {
        ({ stdout } = await execFileAsync("python", [PARSER_SCRIPT, tmpPath], {
          timeout: 30_000,
        }));
      } else {
        throw e;
      }
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[parse-pdf] error:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF.", details: String(err) },
      { status: 500 }
    );
  } finally {
    // Always clean up the temp file.
    try {
      await unlink(tmpPath);
    } catch {
      // Ignore — file may not have been written if the upload failed.
    }
  }
}
