"""
tests/test_wire_extraction.py
-----------------------------
Unit tests for:
  1. LLM extractor — strict JSON parsing & default filling
  2. RDAP domain-age lookup — correct parsing with mocked HTTP
"""

import json
import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

# Pre-import so patch() can resolve dotted paths at decoration time
import extraction.llm_extractor  # noqa: F401
import enrichment.domain_age     # noqa: F401

# ---------------------------------------------------------------------------
# 1. LLM extractor — strict JSON parsing
# ---------------------------------------------------------------------------

class TestLLMExtractorJsonParsing(unittest.TestCase):

    def _make_response(self, text: str):
        """Build a mock Gemini response with .text = text."""
        resp = MagicMock()
        resp.text = text
        return resp

    @patch("extraction.llm_extractor.genai.Client")
    def test_valid_json_round_trip(self, MockClient):
        """Well-formed JSON from the LLM is parsed and defaults filled."""
        payload = {
            "document_type": "Wire Transfer Instructions",
            "escrow_officer": {
                "name": "Jane Smith", "title": None, "company": "First American Title",
                "email": "jane@firstam.com", "phone": "+19495550100", "domains": ["firstam.com"],
            },
            "other_contacts": [],
            "transaction": {
                "property_address": "123 Main St, Irvine CA 92614",
                "closing_date": "2026-03-15",
                "escrow_number": "E-1234", "loan_number": None,
            },
            "wire_details": {
                "beneficiary_name": "First American Title",
                "bank_name": "Wells Fargo", "bank_address": None,
                "routing_number": "121042882", "account_number": "9876543210",
                "swift_code": None, "amount": "350000.00",
            },
            "internet_data": {"domains": ["firstam.com"], "emails": ["jane@firstam.com"], "urls": []},
            "red_flags": [],
            "confidence": 0.95,
        }

        MockClient.return_value.models.generate_content.return_value = (
            self._make_response(json.dumps(payload))
        )

        from extraction.llm_extractor import extract_wire_fields
        result = extract_wire_fields("dummy document text")

        self.assertEqual(result["document_type"], "Wire Transfer Instructions")
        self.assertEqual(result["wire_details"]["routing_number"], "121042882")
        self.assertEqual(result["escrow_officer"]["email"], "jane@firstam.com")
        self.assertEqual(result["confidence"], 0.95)

    @patch("extraction.llm_extractor.genai.Client")
    def test_missing_keys_filled_with_defaults(self, MockClient):
        """Partial JSON (only document_type) gets all missing keys filled."""
        partial = {"document_type": "Wire Instructions"}

        MockClient.return_value.models.generate_content.return_value = (
            self._make_response(json.dumps(partial))
        )

        from extraction.llm_extractor import extract_wire_fields
        result = extract_wire_fields("partial document")

        self.assertEqual(result["document_type"], "Wire Instructions")
        self.assertIsNone(result["escrow_officer"]["name"])
        self.assertEqual(result["internet_data"]["domains"], [])
        self.assertEqual(result["red_flags"], [])
        self.assertEqual(result["confidence"], 0.0)

    @patch("extraction.llm_extractor.genai.Client")
    def test_invalid_json_raises_value_error(self, MockClient):
        """Non-JSON LLM output raises ValueError with a useful message."""
        MockClient.return_value.models.generate_content.return_value = (
            self._make_response("Here is your data: not json {{")
        )

        from extraction.llm_extractor import extract_wire_fields
        with self.assertRaises(ValueError) as ctx:
            extract_wire_fields("bad document")

        self.assertIn("invalid JSON", str(ctx.exception))

    @patch("extraction.llm_extractor.genai.Client")
    def test_non_dict_json_raises_value_error(self, MockClient):
        """A JSON array (not an object) raises ValueError."""
        MockClient.return_value.models.generate_content.return_value = (
            self._make_response(json.dumps(["list", "not", "dict"]))
        )

        from extraction.llm_extractor import extract_wire_fields
        with self.assertRaises(ValueError) as ctx:
            extract_wire_fields("bad document")

        self.assertIn("non-dict", str(ctx.exception))

    @patch("extraction.llm_extractor.genai.Client")
    def test_markdown_fences_stripped(self, MockClient):
        """Gemini markdown code fences around JSON are stripped before parsing."""
        payload = {"document_type": "Wire Instructions"}
        fenced = f"```json\n{json.dumps(payload)}\n```"

        MockClient.return_value.models.generate_content.return_value = (
            self._make_response(fenced)
        )

        from extraction.llm_extractor import extract_wire_fields
        result = extract_wire_fields("some document")
        self.assertEqual(result["document_type"], "Wire Instructions")


# ---------------------------------------------------------------------------
# 2. RDAP domain-age lookup — mocked HTTP
# ---------------------------------------------------------------------------

_BOOTSTRAP_PAYLOAD = {
    "services": [
        [["com", "net"], ["https://rdap.verisign.com/com/v1/"]],
        [["org"],         ["https://rdap.publicinterestregistry.org/rdap/"]],
    ]
}

_RDAP_DOMAIN_PAYLOAD = {
    "objectClassName": "domain",
    "ldhName": "firstam.com",
    "events": [
        {"eventAction": "registration", "eventDate": "1993-04-16T04:00:00Z"},
        {"eventAction": "expiration",   "eventDate": "2027-04-17T04:00:00Z"},
    ],
}


class TestRDAPLookup(unittest.TestCase):

    def _mock_get(self, url, timeout=10):
        resp = MagicMock()
        resp.raise_for_status = MagicMock()
        resp.status_code = 200
        if "data.iana.org" in url:
            resp.json = MagicMock(return_value=_BOOTSTRAP_PAYLOAD)
        elif "/domain/" in url:
            resp.json = MagicMock(return_value=_RDAP_DOMAIN_PAYLOAD)
        else:
            resp.status_code = 404
        return resp

    def test_rdap_returns_correct_creation_date(self):
        """RDAP lookup parses 'registration' event and returns a UTC datetime."""
        import enrichment.domain_age as da

        # Clear caches before test
        da._bootstrap_cache = da._TTLCache(ttl=86400)
        da._domain_cache    = da._TTLCache(ttl=3600)

        with patch("enrichment.domain_age.requests.get", side_effect=self._mock_get):
            exists, created, source, error = da.get_domain_created_date("firstam.com")

        self.assertTrue(exists)
        self.assertIsNotNone(created)
        self.assertEqual(created.year, 1993)
        self.assertEqual(created.month, 4)
        self.assertEqual(created.tzinfo, timezone.utc)
        self.assertEqual(source, "rdap")
        self.assertIsNone(error)

    def test_rdap_404_returns_exists_false(self):
        """A 404 RDAP response means the domain does not exist."""
        import enrichment.domain_age as da

        da._bootstrap_cache = da._TTLCache(ttl=86400)
        da._domain_cache    = da._TTLCache(ttl=3600)

        def mock_get_404(url, timeout=10):
            resp = MagicMock()
            resp.raise_for_status = MagicMock()
            if "data.iana.org" in url:
                resp.status_code = 200
                resp.json = MagicMock(return_value=_BOOTSTRAP_PAYLOAD)
            else:
                resp.status_code = 404
            return resp

        with patch("enrichment.domain_age.requests.get", side_effect=mock_get_404):
            exists, created, source, error = da.get_domain_created_date("definitely-fake-xyz.com")

        self.assertFalse(exists)
        self.assertIsNone(created)

    def test_cache_hit_skips_network(self):
        """A cached result is returned without making any network calls."""
        import enrichment.domain_age as da

        da._bootstrap_cache = da._TTLCache(ttl=86400)
        da._domain_cache    = da._TTLCache(ttl=3600)

        # Prime the cache
        cached_dt = datetime(2000, 1, 1, tzinfo=timezone.utc)
        da._domain_cache.set("cached-domain.com", (True, cached_dt, "rdap", None))

        with patch("enrichment.domain_age.requests.get") as mock_get:
            exists, created, source, error = da.get_domain_created_date("cached-domain.com")
            mock_get.assert_not_called()

        self.assertTrue(exists)
        self.assertEqual(source, "cache")
        self.assertEqual(created.year, 2000)


if __name__ == "__main__":
    unittest.main()
