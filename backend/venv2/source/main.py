import os
import sys
import tempfile
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, File, HTTPException, UploadFile

CURRENT_DIR = Path(__file__).resolve().parent
MORE_DIR = CURRENT_DIR.parent / "more"
if str(MORE_DIR) not in sys.path:
    sys.path.insert(0, str(MORE_DIR))

from wire_pdf_parser import parse_pdf, parse_text

app = FastAPI(title="Backend API")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


def _extract_payload(body: dict[str, Any]) -> tuple[dict[str, Any], str | None]:
    if "payload" in body:
        wrapped = body.get("payload")
        if not isinstance(wrapped, dict):
            raise HTTPException(
                status_code=400,
                detail="Request payload must be an object when using the {batchId, payload} wrapper.",
            )
        batch_id = body.get("batchId")
        return wrapped, batch_id if isinstance(batch_id, str) and batch_id else None

    batch_id = body.get("batchId")
    return body, batch_id if isinstance(batch_id, str) and batch_id else None


def _extract_text_from_message(message: dict[str, Any]) -> str:
    body = message.get("body")
    if isinstance(body, dict):
        text_plain = body.get("textPlain")
        if isinstance(text_plain, str) and text_plain.strip():
            return text_plain.strip()

        text_html = body.get("textHtml")
        if isinstance(text_html, str) and text_html.strip():
            return text_html.strip()

    snippet = message.get("snippet")
    if isinstance(snippet, str) and snippet.strip():
        return snippet.strip()

    return ""


def _collect_message_texts(payload: dict[str, Any]) -> list[str]:
    data = payload.get("data")
    messages = data.get("messages") if isinstance(data, dict) else None
    if not isinstance(messages, list):
        return []

    merged: list[str] = []
    for msg in messages:
        if not isinstance(msg, dict):
            continue

        main_text = _extract_text_from_message(msg)
        if not main_text:
            continue

        lines: list[str] = []
        headers = msg.get("headers")
        if isinstance(headers, dict):
            subject = headers.get("subject")
            sender = headers.get("from")
            if isinstance(subject, str) and subject.strip():
                lines.append(f"Subject: {subject.strip()}")
            if isinstance(sender, str) and sender.strip():
                lines.append(f"From: {sender.strip()}")
        lines.append(main_text)
        merged.append("\n".join(lines))

    return merged


def _build_merged_text(payload: dict[str, Any]) -> tuple[str, int]:
    message_texts = _collect_message_texts(payload)
    if message_texts:
        return "\n\n--- MESSAGE BREAK ---\n\n".join(message_texts), len(message_texts)

    candidates: list[str] = []
    for key in ("document_text", "text"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            candidates.append(value.strip())

    body = payload.get("body")
    if isinstance(body, dict):
        for key in ("textPlain", "textHtml"):
            value = body.get(key)
            if isinstance(value, str) and value.strip():
                candidates.append(value.strip())

    data = payload.get("data")
    if isinstance(data, dict):
        for key in ("document_text", "text"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                candidates.append(value.strip())

    return "\n\n".join(candidates).strip(), 0


@app.post("/process")
def process_data(data: Any = Body(...)) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object.")

    payload, batch_id = _extract_payload(data)
    merged_text, message_count = _build_merged_text(payload)

    sender_address = payload.get("senderAddress")
    used_sender_address: str | None = None
    if isinstance(sender_address, str) and sender_address.strip():
        used_sender_address = sender_address.strip()
        merged_text = f"Sender address context: {used_sender_address}\n\n{merged_text}".strip()

    if not merged_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No analyzable text found in payload messages or supported text fields.",
        )

    try:
        result = parse_text(merged_text)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}") from exc

    input_summary: dict[str, Any] = {
        "batch_id": batch_id,
        "source": payload.get("source") if isinstance(payload.get("source"), str) else None,
        "message_count": message_count,
    }
    if used_sender_address:
        input_summary["used_sender_address"] = used_sender_address

    print("returing")
    return {"status": "ok", "input_summary": input_summary, "result": result}


@app.post("/process-pdf")
async def process_pdf(file: UploadFile = File(...)) -> dict[str, Any]:
    filename = file.filename or "uploaded.pdf"
    if file.content_type != "application/pdf" and not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a PDF.")

    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")

    temp_pdf_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(contents)
            temp_pdf_path = temp_file.name
        result = parse_pdf(temp_pdf_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {exc}") from exc
    finally:
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)

    print("returing")
    return {
        "status": "ok",
        "filename": filename,
        "content_type": file.content_type,
        "size_bytes": len(contents),
        "result": result,
    }

# uvicorn main:app --reload --host 0.0.0.0 --port 8000
