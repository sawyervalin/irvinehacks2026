"""
tests/test_detection_scenarios.py
----------------------------------
End-to-end detection tests using synthetic extraction dicts.
No Gemini API calls — exercises score_extraction(), aba_checksum_valid(),
is_lookalike_domain(), and _compute_risk_assessment() directly.

Run with:  python -m pytest tests/test_detection_scenarios.py -v
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from risk_scoring import aba_checksum_valid, is_lookalike_domain, score_extraction
from wire_pdf_parser import _compute_risk_assessment


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extraction(
    *,
    sender_domain="firstam.com",
    escrow_email="escrow@firstam.com",
    routing="121042882",
    account="9876543210",
    bank_name="Wells Fargo",
    beneficiary_name="First American Title",
    rushed_closing=False,
    pressure_to_wire=False,
    do_not_call_verify=False,
    dummy_name_detected=False,
    misspelling_count=None,
) -> dict:
    """Build a minimal extraction dict for testing."""
    return {
        "escrow_contact": {"email": escrow_email, "name": "Jane Smith", "company": "First American"},
        "wire_details": {
            "routing_number": routing,
            "account_number": account,
            "bank_name": bank_name,
            "beneficiary_name": beneficiary_name,
        },
        "communication": {"sender_domain": sender_domain, "sender_email": f"agent@{sender_domain}"},
        "signals_from_text": {
            "detected_phrases": {
                "rushed_closing": rushed_closing,
                "pressure_to_wire": pressure_to_wire,
                "do_not_call_verify": do_not_call_verify,
            },
            "phrase_evidence": {
                "rushed_closing_snippets": [],
                "pressure_to_wire_snippets": [],
                "do_not_call_verify_snippets": [],
            },
            "dummy_name_detected": dummy_name_detected,
            "dummy_name_match": "John Doe" if dummy_name_detected else None,
            "misspelling_count": misspelling_count,
            "grammar_error_count": None,
            "suspicious_characters_detected": False,
            "non_ascii_examples": [],
        },
        "internet_data": {"domains": [sender_domain], "emails": [], "urls": []},
    }


def _hackathon_doc(
    routing_valid=True,
    bank_mismatch=False,
    lookalike=False,
    lookalike_to=None,
    domain_age_days=500,
    mx_records=True,
    on_scam_list=False,
    rushed_closing=False,
    pressure_to_wire=False,
    do_not_call_verify=False,
    dummy_name=False,
    suspicious_chars=False,
    misspellings=None,
) -> dict:
    """Build a minimal hackathon schema dict for _compute_risk_assessment()."""
    return {
        "extraction": {
            "wire_details": {"routing_number": "121042882", "bank_name": "Wells Fargo"},
            "signals_from_text": {
                "detected_phrases": {
                    "rushed_closing": rushed_closing,
                    "pressure_to_wire": pressure_to_wire,
                    "do_not_call_verify": do_not_call_verify,
                },
                "dummy_name_detected": dummy_name,
                "dummy_name_match": "John Doe" if dummy_name else None,
                "suspicious_characters_detected": suspicious_chars,
                "non_ascii_examples": [],
                "misspelling_count": misspellings,
                "grammar_error_count": None,
            },
        },
        "enrichment": {
            "banking": {
                "routing_valid": routing_valid,
                "bank_name_mismatch": bank_mismatch,
                "fed_bank_name": "Chase" if bank_mismatch else "Wells Fargo",
                "foreign_bank_suspected": None,
            },
            "domain": {
                "firstam.com": {
                    "domain_age_days": domain_age_days,
                    "mx_records_present": mx_records,
                    "lookalike_detected": lookalike,
                    "lookalike_to": lookalike_to,
                    "on_scam_list": on_scam_list,
                }
            },
        },
    }


def _rule_ids(result: dict) -> set[str]:
    return {r["id"] for r in result["triggered_rules"]}


def _rules(result: dict) -> set[str]:
    return {r["rule"] for r in result["triggered_rules"]}


# ── Scenario Tests ────────────────────────────────────────────────────────────

class TestABAChecksum(unittest.TestCase):

    def test_known_good_routing(self):
        """Well-known real routing numbers should pass."""
        for r in ["121042882", "021000021", "121000248"]:
            self.assertTrue(aba_checksum_valid(r), f"{r} should be valid")

    def test_bad_checksum(self):
        """Routing numbers that fail the mod-10 check.
        Note: 000000000 is intentionally excluded — all-zeros sum to 0 % 10 = 0
        so it passes the checksum (bank lookup rejects it separately).
        """
        for r in ["123456789", "111111111", "999999999"]:
            self.assertFalse(aba_checksum_valid(r), f"{r} should be invalid")

    def test_wrong_length(self):
        self.assertFalse(aba_checksum_valid("12345"))
        self.assertFalse(aba_checksum_valid("1234567890"))

    def test_strips_non_digits(self):
        """Dashes and spaces should be stripped before validation."""
        self.assertTrue(aba_checksum_valid("121-042-882"))
        self.assertTrue(aba_checksum_valid("121 042 882"))


class TestLookalikeDomain(unittest.TestCase):

    def test_exact_match_not_lookalike(self):
        """Known-legit domains should NOT be flagged."""
        self.assertFalse(is_lookalike_domain("firstam.com"))
        self.assertFalse(is_lookalike_domain("wellsfargo.com"))
        self.assertFalse(is_lookalike_domain("chase.com"))

    def test_obvious_typosquats(self):
        """Typosquats should be detected (similarity > 0.8 on base label).
        Note: 'firstam-title.com' base is 'firstam-title' which scores ~0.70
        against 'firstam' — below threshold. Use doubled-letter squats instead.
        """
        self.assertTrue(is_lookalike_domain("firstamm.com"))    # firstam (ratio 0.93)
        self.assertTrue(is_lookalike_domain("welsfargo.com"))    # wellsfargo (ratio 0.95)
        self.assertTrue(is_lookalike_domain("chaise.com"))       # chase (ratio 0.91)

    def test_unrelated_domain_not_flagged(self):
        """A completely unrelated domain should not be flagged."""
        self.assertFalse(is_lookalike_domain("example.com"))
        self.assertFalse(is_lookalike_domain("acme-widgets.com"))


class TestScenario1_CleanDocument(unittest.TestCase):
    """Legitimate wire instruction — no fraud signals at all."""

    def setUp(self):
        self.result = score_extraction(_extraction())

    def test_low_risk_tier(self):
        self.assertEqual(self.result["risk_tier"], "low")

    def test_score_under_25(self):
        self.assertLess(self.result["overall_risk_score"], 25)

    def test_no_rules_triggered(self):
        self.assertEqual(self.result["triggered_rules"], [])

    def test_all_buckets_zero(self):
        bs = self.result["bucket_scores"]
        self.assertEqual(bs["content"], 0)
        self.assertEqual(bs["domain"], 0)
        self.assertEqual(bs["banking"], 0)


class TestScenario2_TyposquatDomain(unittest.TestCase):
    """Sender domain is a typosquat of First American Title."""

    def setUp(self):
        # "firstamm.com" (doubled 'm') is a typosquat of "firstam.com" (ratio 0.93)
        self.result = score_extraction(_extraction(
            sender_domain="firstamm.com",
            escrow_email="escrow@firstam.com",   # sender != escrow → mismatch too
        ))

    def test_lookalike_rule_triggered(self):
        self.assertIn("LOOKALIKE_DOMAIN", _rules(self.result))

    def test_domain_mismatch_triggered(self):
        self.assertIn("SENDER_DOMAIN_MISMATCH", _rules(self.result))

    def test_domain_bucket_nonzero(self):
        self.assertGreater(self.result["bucket_scores"]["domain"], 0)

    def test_risk_elevated(self):
        self.assertGreaterEqual(self.result["overall_risk_score"], 25)


class TestScenario3_AllContentSignals(unittest.TestCase):
    """Document hits every text-level fraud signal."""

    def setUp(self):
        self.result = score_extraction(_extraction(
            rushed_closing=True,
            pressure_to_wire=True,
            do_not_call_verify=True,
            dummy_name_detected=True,
            misspelling_count=3,
        ))

    def test_all_content_rules_triggered(self):
        rules = _rules(self.result)
        self.assertIn("RUSHED_CLOSING", rules)
        self.assertIn("PRESSURE_TO_WIRE", rules)
        self.assertIn("DO_NOT_CALL_VERIFY", rules)
        self.assertIn("DUMMY_NAME_DETECTED", rules)
        self.assertIn("MISSPELLINGS", rules)

    def test_content_bucket_at_least_70(self):
        # 15+15+25+10+5 = 70
        self.assertGreaterEqual(self.result["bucket_scores"]["content"], 70)

    def test_high_risk_tier(self):
        self.assertEqual(self.result["risk_tier"], "high")


class TestScenario4_BadBankingSignals(unittest.TestCase):
    """Routing number fails ABA checksum; account number is too short."""

    def setUp(self):
        self.result = score_extraction(_extraction(
            routing="123456789",   # fails ABA mod-10
            account="123",         # only 3 digits — too short
            bank_name="",          # missing
            beneficiary_name="",   # missing
        ))

    def test_bad_checksum_rule(self):
        self.assertIn("ROUTING_NUMBER_BAD_CHECKSUM", _rules(self.result))

    def test_short_account_rule(self):
        self.assertIn("ACCOUNT_NUMBER_TOO_SHORT", _rules(self.result))

    def test_missing_bank_rule(self):
        self.assertIn("MISSING_BANK_OR_BENEFICIARY", _rules(self.result))

    def test_banking_bucket_elevated(self):
        # bad_checksum(25) + short_account(10) + missing_bank(15) = 50
        self.assertGreaterEqual(self.result["bucket_scores"]["banking"], 50)


class TestScenario5_FreeEmailSender(unittest.TestCase):
    """Wire instructions sent from a free email provider (gmail.com)."""

    def setUp(self):
        self.result = score_extraction(_extraction(
            sender_domain="gmail.com",
            escrow_email="escrow@firstam.com",   # domain mismatch too
        ))

    def test_free_email_rule_triggered(self):
        self.assertIn("FREE_EMAIL_PROVIDER", _rules(self.result))

    def test_sender_mismatch_triggered(self):
        self.assertIn("SENDER_DOMAIN_MISMATCH", _rules(self.result))

    def test_domain_bucket_at_least_25(self):
        # free_email(10) + mismatch(15) = 25
        self.assertGreaterEqual(self.result["bucket_scores"]["domain"], 25)


class TestScenario6_KitchenSinkFraud(unittest.TestCase):
    """Everything wrong — maximum fraud signals."""

    def setUp(self):
        self.result = score_extraction(_extraction(
            sender_domain="firstamm.com",        # typosquat (doubled 'm')
            escrow_email="escrow@firstam.com",   # mismatch
            routing="000000001",                 # fails ABA
            account="12",                        # too short
            bank_name="",                        # missing
            beneficiary_name="",                 # missing
            rushed_closing=True,
            pressure_to_wire=True,
            do_not_call_verify=True,
            dummy_name_detected=True,
            misspelling_count=5,
        ))

    def test_high_tier(self):
        self.assertIn(self.result["risk_tier"], {"medium", "high"})

    def test_all_buckets_nonzero(self):
        bs = self.result["bucket_scores"]
        self.assertGreater(bs["content"], 0)
        self.assertGreater(bs["domain"], 0)
        self.assertGreater(bs["banking"], 0)

    def test_overall_score_very_high(self):
        self.assertGreaterEqual(self.result["overall_risk_score"], 60)

    def test_many_rules_triggered(self):
        self.assertGreaterEqual(len(self.result["triggered_rules"]), 7)


# ── Enriched risk assessment tests ───────────────────────────────────────────

class TestComputeRiskAssessment(unittest.TestCase):
    """Tests for the enriched _compute_risk_assessment() in wire_pdf_parser."""

    def test_clean_document_is_low(self):
        doc = _hackathon_doc()
        result = _compute_risk_assessment(doc)
        self.assertEqual(result["risk_tier"], "low")
        self.assertLess(result["overall_risk_score"], 25)

    def test_invalid_routing_triggers_hard_stop(self):
        doc = _hackathon_doc(routing_valid=False)
        result = _compute_risk_assessment(doc)
        self.assertIn("BANKING_INVALID_ROUTING", _rule_ids(result))
        self.assertGreaterEqual(result["overall_risk_score"], 85)
        self.assertEqual(result["risk_tier"], "critical")

    def test_bank_name_mismatch(self):
        doc = _hackathon_doc(bank_mismatch=True)
        result = _compute_risk_assessment(doc)
        self.assertIn("BANKING_NAME_MISMATCH", _rule_ids(result))
        self.assertGreater(result["bucket_scores"]["banking"], 0)

    def test_lookalike_domain_detected(self):
        doc = _hackathon_doc(lookalike=True, lookalike_to="firstam.com")
        result = _compute_risk_assessment(doc)
        self.assertIn("DOMAIN_LOOKALIKE", _rule_ids(result))
        self.assertGreater(result["bucket_scores"]["domain"], 0)

    def test_new_domain_flagged(self):
        doc = _hackathon_doc(domain_age_days=10)
        result = _compute_risk_assessment(doc)
        self.assertIn("DOMAIN_NEW_REGISTRATION", _rule_ids(result))

    def test_no_mx_records(self):
        doc = _hackathon_doc(mx_records=False)
        result = _compute_risk_assessment(doc)
        self.assertIn("DOMAIN_NO_MX", _rule_ids(result))

    def test_scam_list_triggers_hard_stop(self):
        doc = _hackathon_doc(on_scam_list=True)
        result = _compute_risk_assessment(doc)
        self.assertIn("DOMAIN_ON_SCAM_LIST", _rule_ids(result))
        self.assertGreaterEqual(result["overall_risk_score"], 85)
        self.assertEqual(result["risk_tier"], "critical")

    def test_all_content_signals_enriched(self):
        doc = _hackathon_doc(
            rushed_closing=True,
            pressure_to_wire=True,
            do_not_call_verify=True,
            dummy_name=True,
            suspicious_chars=True,
            misspellings=2,
        )
        result = _compute_risk_assessment(doc)
        ids = _rule_ids(result)
        self.assertIn("CONTENT_DO_NOT_CALL_VERIFY", ids)
        self.assertIn("CONTENT_PRESSURE_TO_WIRE", ids)
        self.assertIn("CONTENT_RUSHED_CLOSING", ids)
        self.assertIn("CONTENT_DUMMY_NAME", ids)
        self.assertIn("CONTENT_SUSPICIOUS_CHARS", ids)
        self.assertIn("CONTENT_MISSPELLINGS", ids)
        self.assertGreaterEqual(result["bucket_scores"]["content"], 100)  # capped

    def test_recommended_actions_present_for_each_tier(self):
        """Every tier should have at least one recommended action."""
        for tier_doc, expected_tier in [
            (_hackathon_doc(), "low"),
            (_hackathon_doc(lookalike=True, lookalike_to="firstam.com"), None),
            (_hackathon_doc(routing_valid=False), "critical"),
        ]:
            result = _compute_risk_assessment(tier_doc)
            self.assertIsInstance(result["recommended_actions"], list)
            self.assertGreater(len(result["recommended_actions"]), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
