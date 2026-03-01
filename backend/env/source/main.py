from typing import Any
from fastapi import FastAPI, Body, File, HTTPException, UploadFile

app = FastAPI(title="Backend API")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/process")
def process_data(data: dict[str, Any] = Body(...)) -> dict[str, str]:
    # print(data)

    return {"status": "ok"}


@app.post("/process-pdf")
async def process_pdf(file: UploadFile = File(...)) -> dict[str, Any]:
    filename = file.filename or "uploaded.pdf"
    if file.content_type != "application/pdf" and not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a PDF.")

    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")

    # Placeholder for real parsing/processing logic.
    return {
        "status": "ok",
        "filename": filename,
        "content_type": file.content_type,
        "size_bytes": len(contents)
    }

# uvicorn main:app --reload --host 0.0.0.0 --port 8000
