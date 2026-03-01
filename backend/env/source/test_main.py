import os
import sys
import unittest
from unittest.mock import patch
from pathlib import Path

from fastapi.testclient import TestClient

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import main


def _sample_result(parsing_errors=None):
    return {
        "document_text_snippet": "snippet",
        "extracted_fields": {},
        "llm_extracted": {},
        "bank_name_verification": {},
        "domain_verification": {},
        "hackathon_schema": {},
        "parsing_errors": parsing_errors or [],
        "version": "wire_pdf_parser_v2",
    }


class MainApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(main.app)

    def test_health(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    @patch("main.parse_text")
    def test_process_merges_multiple_messages_and_returns_full_result(self, mock_parse_text) -> None:
        mock_parse_text.return_value = _sample_result()
        body = {
            "batchId": "batch-1",
            "payload": {
                "source": "chrome-extension",
                "data": {
                    "messages": [
                        {
                            "headers": {"subject": "Wire Update", "from": "agent@example.com"},
                            "body": {"textPlain": "First message plain text"},
                            "snippet": "ignored snippet",
                        },
                        {"snippet": "Second message snippet only"},
                    ]
                },
            },
        }

        response = self.client.post("/process", json=body)
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["input_summary"]["batch_id"], "batch-1")
        self.assertEqual(payload["input_summary"]["source"], "chrome-extension")
        self.assertEqual(payload["input_summary"]["message_count"], 2)
        self.assertEqual(payload["result"], _sample_result())

        mock_parse_text.assert_called_once()
        merged_text = mock_parse_text.call_args[0][0]
        self.assertIn("Subject: Wire Update", merged_text)
        self.assertIn("From: agent@example.com", merged_text)
        self.assertIn("First message plain text", merged_text)
        self.assertIn("Second message snippet only", merged_text)

    @patch("main.parse_text")
    def test_process_manual_payload_includes_sender_context(self, mock_parse_text) -> None:
        mock_parse_text.return_value = _sample_result()
        body = {
            "payload": {
                "source": "manual",
                "senderAddress": "manual.sender@example.com",
                "text": "Manual email body text",
            }
        }

        response = self.client.post("/process", json=body)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["input_summary"]["used_sender_address"], "manual.sender@example.com")

        mock_parse_text.assert_called_once()
        merged_text = mock_parse_text.call_args[0][0]
        self.assertIn("Sender address context: manual.sender@example.com", merged_text)
        self.assertIn("Manual email body text", merged_text)

    def test_process_invalid_shape_returns_400(self) -> None:
        response = self.client.post("/process", json={"batchId": "x", "payload": "bad"})
        self.assertEqual(response.status_code, 400)

    @patch("main.parse_text")
    def test_process_no_usable_text_returns_400(self, mock_parse_text) -> None:
        body = {"payload": {"source": "chrome-extension", "data": {"messages": [{}]}}}
        response = self.client.post("/process", json=body)
        self.assertEqual(response.status_code, 400)
        mock_parse_text.assert_not_called()

    def test_process_non_pdf_upload_returns_400(self) -> None:
        response = self.client.post(
            "/process-pdf",
            files={"file": ("file.txt", b"not pdf", "text/plain")},
        )
        self.assertEqual(response.status_code, 400)

    def test_process_empty_pdf_returns_400(self) -> None:
        response = self.client.post(
            "/process-pdf",
            files={"file": ("empty.pdf", b"", "application/pdf")},
        )
        self.assertEqual(response.status_code, 400)

    @patch("main.parse_pdf")
    def test_process_pdf_uses_temp_file_and_returns_full_result(self, mock_parse_pdf) -> None:
        saved = {"path": None}

        def _fake_parse_pdf(path: str):
            saved["path"] = path
            self.assertTrue(os.path.exists(path))
            return _sample_result()

        mock_parse_pdf.side_effect = _fake_parse_pdf

        response = self.client.post(
            "/process-pdf",
            files={"file": ("wire.pdf", b"%PDF-1.4 sample bytes", "application/pdf")},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["filename"], "wire.pdf")
        self.assertEqual(data["content_type"], "application/pdf")
        self.assertEqual(data["result"], _sample_result())
        self.assertIsNotNone(saved["path"])
        self.assertFalse(os.path.exists(saved["path"]))

    @patch("main.parse_text")
    def test_process_partial_failure_returns_200_with_parsing_errors(self, mock_parse_text) -> None:
        mock_parse_text.return_value = _sample_result(
            parsing_errors=["LLM extraction error: missing GOOGLE_API_KEY"]
        )
        body = {"payload": {"text": "Hello"}}
        response = self.client.post("/process", json=body)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(
            data["result"]["parsing_errors"],
            ["LLM extraction error: missing GOOGLE_API_KEY"],
        )


if __name__ == "__main__":
    unittest.main()
