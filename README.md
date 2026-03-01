# Constryke

**Protect your money before you wire it.**

Wire fraud is the fastest-growing financial crime in real estate. Scammers intercept email threads, impersonate title companies, and swap out legitimate wire instructions with their own bank details — right before closing day. First-time home buyers lose an average of $120,000 in seconds, and it's nearly impossible to recover.

Constryke catches it before you send.

---

## What It Does

Paste an email, upload a PDF, or connect your Gmail — Constryke's AI engine analyzes wire transfer instructions for fraud signals in seconds.

It checks:

- **Banking details** — validates routing numbers against the ABA checksum, looks up the bank name independently, and flags mismatches
- **Domain authenticity** — detects typosquatted domains (e.g. `firstam-title.com` instead of `firstam.com`), checks domain age, MX records, SPF/DMARC, and Google Safe Browsing
- **Language patterns** — flags pressure tactics ("wire immediately"), verification-evasion phrases ("do not call to confirm"), rushed closing language, and dummy names
- **Email identity** — catches free-email providers posing as title companies and sender/escrow domain mismatches

You get a risk score, a plain-English explanation, and specific reasons why the document was flagged.

---

## How to Use It

There are three ways to submit a document for analysis:

### 1. Paste an Email
Go to the **Threat Check** page, paste any email you received (subject, body, headers — whatever you have), enter the sender's email address, and click **Check for threats**.

### 2. Upload a PDF
Got a wire instruction sheet as an attachment? Upload it directly on the Threat Check page.

### 3. Chrome Extension (Gmail)
Install the Constryke Chrome extension, search your Gmail for wire-related emails, and send them to the app with one click. No copy-paste needed.

---

## Setup

### Requirements
- Python 3.11+
- Node.js 18+
- A Google API key (for the AI extraction engine)

### 1. Backend

```bash
cd backend/venv2
pip install fastapi uvicorn pdfplumber google-genai requests dnspython python-dotenv
```

Create `backend/venv2/.env`:
```
GOOGLE_API_KEY=your_google_api_key_here
```

Start the server:
```bash
uvicorn source.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
DUMMY_BACKEND_URL=http://localhost:8000/process
DUMMY_PDF_BACKEND_URL=http://localhost:8000/process-pdf
EXTENSION_API_KEY=dev-extension-key-change-me
```

Start the app:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Chrome Extension (Optional)

1. Open `chrome://extensions` in Chrome
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked** and select the `chrome-extension/` folder
4. The extension will appear in your toolbar

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Extraction | Google Gemini 2.5 Flash |
| Backend | Python, FastAPI |
| PDF Parsing | pdfplumber |
| Domain Verification | DNS lookups, RDAP/WHOIS, Google Safe Browsing |
| Frontend | Next.js 16, React 19, TypeScript |
| 3D Landing Page | Three.js, React Three Fiber |
| Animations | Framer Motion |
| Browser Extension | Chrome Manifest v3, Gmail API |

---

## Project Structure

```
constryke/
├── backend/        Python API — parsing, AI extraction, risk scoring
├── frontend/       Next.js web app — landing page + threat dashboard
└── chrome-extension/  Gmail search + one-click ingest
```

---

## Built at IrvineHacks 2026
