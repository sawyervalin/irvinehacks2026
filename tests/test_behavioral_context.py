#!/usr/bin/env python3
"""
tests/test_behavioral_context.py
---------------------------------
Integration tests for behavioral_context.analyze_email() and
email_wire_fusion.fuse().

Fixtures are hand-crafted normalized email dicts that mirror exactly what the
Chrome extension produces after passing raw Gmail API messages through
normalize_gmail.py.

Run with pytest:
    pytest tests/test_behavioral_context.py -v

Run directly (prints results without assertions):
    python tests/test_behavioral_context.py
"""

import json
import sys
from pathlib import Path

# ── path + env setup ──────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

BACKEND_MORE = ROOT / "backend" / "venv" / "more"
if str(BACKEND_MORE) not in sys.path:
    sys.path.insert(0, str(BACKEND_MORE))

from behavioral_context import analyze_email  # noqa: E402
from email_wire_fusion import fuse            # noqa: E402
from wire_pdf_parser import parse_text        # noqa: E402


# ══════════════════════════════════════════════════════════════════════════════
# Fixtures — normalized Gmail JSON (Chrome extension output shape)
# ══════════════════════════════════════════════════════════════════════════════

# ── Fixture 1: BEC wire-fraud attack impersonating an escrow officer ──────────
# Attacker spoofs First American Title using a lookalike domain.
# All auth fails. Email contains changed wire instructions + urgency.
FIXTURE_BEC_WIRE_FRAUD = {
    "source": "gmail",
    "message_id": "18f3a2c9d4e10001",
    "thread_id":  "18f3a2c9d4e10001",
    "internal_date_ms": "1740000000000",
    "labels": ["INBOX", "UNREAD"],
    "headers": {
        "from_raw":   "Sarah Blake <s.blake@firstamerican-title.net>",
        "from_email": "s.blake@firstamerican-title.net",
        "from_name":  "Sarah Blake",
        "to":         "buyer@gmail.com",
        "subject":    "URGENT: Updated Wire Instructions - 4821 Maple Grove Dr Closing",
        "date":       "Fri, 28 Feb 2025 09:14:03 -0800",
        "reply_to":   "s.blake@firstamerican-title.net",
        "return_path": "bounce@firstamerican-title.net",
        "list_id":    None,
        "list_unsubscribe":      [],
        "list_unsubscribe_post": None,
        "auth_summary": {
            "spf":  "fail",
            "dkim": "fail",
            "dmarc": "fail",
            "raw": "spf=fail smtp.mailfrom=firstamerican-title.net; dkim=fail; dmarc=fail",
        },
    },
    "content": {
        "snippet": "URGENT: Our wire instructions have changed. Please disregard the previous email.",
        "text": (
            "Dear Buyer,\n\n"
            "IMPORTANT NOTICE: Our banking information has changed effective immediately. "
            "Please disregard the previous wire instructions you received.\n\n"
            "Please wire your closing funds TODAY using the updated instructions below. "
            "Closing is scheduled for this afternoon and we must receive funds by 2:00 PM.\n\n"
            "UPDATED WIRE INSTRUCTIONS:\n"
            "Bank Name: Pacific Trust Bank\n"
            "Routing Number: 026009593\n"
            "Account Number: 8847201938\n"
            "Beneficiary: First American Title Trust Account\n"
            "Reference: 4821 Maple Grove Dr\n\n"
            "This is time sensitive. Wire immediately to avoid closing delays.\n"
            "Do not call our office to verify — our phones are down for system maintenance. "
            "Only communicate via email.\n\n"
            "Regards,\n"
            "Sarah Blake\n"
            "Escrow Officer\n"
            "First American Title & Escrow\n"
            "Tel: (555) 203-1847"
        ),
    },
    "links": {
        "urls":  [],
        "hosts": [],
    },
    "signals": {
        "num_links":                  0,
        "has_unsubscribe":            False,
        "has_physical_address_hint":  False,
        "has_policy_footer_hint":     False,
        "cta_phrases":                [],
        "incentive_phrases":          [],
        "urgency_phrases":            ["URGENT", "immediately", "TODAY", "today", "deadline"],
        "wire_payment_phrases":       ["wire", "Routing Number", "Account Number", "Wire immediately"],
        "vendor_hosts":               [],
    },
}

# ── Fixture 5: Unicode / homograph attack ─────────────────────────────────────
# Attacker substitutes Cyrillic lookalike characters throughout the from-address
# and body to evade ASCII-based keyword filters.
# Cyrillic: і=U+0456  а=U+0430  о=U+043E  е=U+0435  с=U+0441
#           Р=U+0420  В=U+0412  А=U+0410  Т=U+0422  С=U+0421
FIXTURE_UNICODE_HOMOGRAPH = {
    "source": "gmail",
    "message_id": "18f3e7f8a9b10005",
    "thread_id":  "18f3e7f8a9b10005",
    "internal_date_ms": "1740100000000",
    "labels": ["INBOX", "UNREAD"],
    "headers": {
        # Domain uses Cyrillic і (U+0456) and а (U+0430) — visually identical to ASCII
        "from_raw":    "Thomas Reed <t.reed@f\u0456rstamer\u0456c\u0430n-title.com>",
        "from_email":  "t.reed@f\u0456rstamer\u0456c\u0430n-title.com",
        "from_name":   "Thomas Reed",
        "to":          "buyer@gmail.com",
        "subject":     "Cl\u043esing W\u0456re \u0406nstructions \u2014 7741 Cedarbrook Ave",
        "date":        "Fri, 28 Feb 2025 13:22:01 -0800",
        "reply_to":    "t.reed@f\u0456rstamer\u0456c\u0430n-title.com",
        "return_path": "bounce@f\u0456rstamer\u0456c\u0430n-title.com",
        "list_id":    None,
        "list_unsubscribe":      [],
        "list_unsubscribe_post": None,
        "auth_summary": {
            "spf":   "fail",
            "dkim":  "fail",
            "dmarc": "fail",
            "raw": "spf=fail; dkim=fail; dmarc=fail",
        },
    },
    "content": {
        "snippet": "W\u0456re funds t\u043e the \u0430cc\u043eunt below t\u043ed\u0430y \u043er cl\u043esing will be del\u0430yed.",
        "text": (
            "De\u0430r V\u0430lued \u0421lient,\n\n"
            "\u0420le\u0430se review the w\u0456re tr\u0430nsfer \u0456nstructions f\u043er your upc\u043em\u0456ng cl\u043es\u0456ng:\n\n"
            "\u0412\u0430nk: F\u0456rst \u0410mer\u0456c\u0430n \u0422rust\n"
            "R\u043eut\u0456ng: 026009593\n"
            "\u0410ccount: 7712938847\n"
            "\u0410mount: $318,750.00\n\n"
            "\u0420le\u0430se w\u0456re t\u043ed\u0430y. \u0422h\u0456s \u0456s t\u0456me sens\u0456t\u0456ve.\n\n"
            "\u0422hom\u0430s Reed\n"
            "Escr\u043ew Off\u0456cer"
        ),
    },
    "links": {"urls": [], "hosts": []},
    "signals": {
        # Regex-based extractors miss the obfuscated phrases — Gemini must catch them
        "num_links":                  0,
        "has_unsubscribe":            False,
        "has_physical_address_hint":  False,
        "has_policy_footer_hint":     False,
        "cta_phrases":                [],
        "incentive_phrases":          [],
        "urgency_phrases":            [],
        "wire_payment_phrases":       [],
        "vendor_hosts":               [],
    },
}


# ── Fixture 6: Bank name mismatch ─────────────────────────────────────────────
# Wire doc claims "JPMorgan Chase" but routing 021000089 belongs to Citibank.
# The wire parser's bank lookup catches this; the email itself adds weak auth.
FIXTURE_BANK_MISMATCH_EMAIL = {
    "source": "gmail",
    "message_id": "18f3f9a0b1c20006",
    "thread_id":  "18f3f9a0b1c20006",
    "internal_date_ms": "1740150000000",
    "labels": ["INBOX", "UNREAD"],
    "headers": {
        "from_raw":   "Karen Simmons <k.simmons@pacificshores-title.com>",
        "from_email": "k.simmons@pacificshores-title.com",
        "from_name":  "Karen Simmons",
        "to":         "buyer@gmail.com",
        "subject":    "Wire Instructions for 892 Oceanview Drive Closing",
        "date":       "Sat, 01 Mar 2025 10:05:17 -0800",
        "reply_to":   "k.simmons@pacificshores-title.com",
        "return_path": "k.simmons@pacificshores-title.com",
        "list_id":    None,
        "list_unsubscribe":      [],
        "list_unsubscribe_post": None,
        "auth_summary": {
            "spf":   "pass",
            "dkim":  "fail",
            "dmarc": "fail",
            "raw": "spf=pass smtp.mailfrom=pacificshores-title.com; dkim=fail; dmarc=fail",
        },
    },
    "content": {
        "snippet": "Wire instructions for your closing at JPMorgan Chase Bank.",
        "text": (
            "Hi,\n\n"
            "Please use the following wire instructions for your closing at 892 Oceanview Drive:\n\n"
            "Bank: JPMorgan Chase Bank\n"
            "Routing: 021000089\n"
            "Account: 4491827365\n"
            "Beneficiary: Pacific Shores Title Trust\n"
            "Amount: $525,000.00\n\n"
            "Please wire by end of business today.\n\n"
            "Karen Simmons\n"
            "Escrow Officer, Pacific Shores Title"
        ),
    },
    "links": {"urls": [], "hosts": []},
    "signals": {
        "num_links":                  0,
        "has_unsubscribe":            False,
        "has_physical_address_hint":  False,
        "has_policy_footer_hint":     False,
        "cta_phrases":                [],
        "incentive_phrases":          [],
        "urgency_phrases":            ["today"],
        "wire_payment_phrases":       ["wire", "Routing", "Account"],
        "vendor_hosts":               [],
    },
}

# Wire doc for bank mismatch: claims Chase but routing 021000089 = Citibank
WIRE_TEXT_BANK_MISMATCH = """
WIRE TRANSFER INSTRUCTIONS
Pacific Shores Title & Escrow
Escrow Officer: Karen Simmons
Email: k.simmons@pacificshores-title.com

Property: 892 Oceanview Drive, San Diego CA 92109
Closing Date: March 1, 2025
Amount Due: $525,000.00

WIRING INSTRUCTIONS:
Bank: JPMorgan Chase Bank
Routing Number: 021000089
Account Number: 4491827365
Beneficiary: Pacific Shores Title Trust Account
Reference: 892 Oceanview Drive
"""


# ── Fixture 7: Escrow officer name mismatch (email vs wire doc) ───────────────
# Email is from David Chen and his name appears prominently throughout the body.
# The wire doc fraudulently names "Margaret Sullivan" as escrow officer.
# The fusion layer's ESCROW_OFFICER_NOT_IN_EMAIL cross-signal must catch this.
FIXTURE_NAME_MISMATCH_EMAIL = {
    "source": "gmail",
    "message_id": "18f4a1b2c3d40007",
    "thread_id":  "18f4a1b2c3d40007",
    "internal_date_ms": "1740200000000",
    "labels": ["INBOX", "UNREAD"],
    "headers": {
        "from_raw":   "David Chen <d.chen@westcoasttitle.com>",
        "from_email": "d.chen@westcoasttitle.com",
        "from_name":  "David Chen",
        "to":         "buyer@gmail.com",
        "subject":    "Wire Transfer Instructions — 1605 Birchwood Court",
        "date":       "Sat, 01 Mar 2025 14:30:00 -0800",
        "reply_to":   "d.chen@westcoasttitle.com",
        "return_path": "d.chen@westcoasttitle.com",
        "list_id":    None,
        "list_unsubscribe":      [],
        "list_unsubscribe_post": None,
        "auth_summary": {
            "spf":   "pass",
            "dkim":  "pass",
            "dmarc": "fail",
            "raw": "spf=pass; dkim=pass; dmarc=fail",
        },
    },
    "content": {
        "snippet": "Hi, this is David Chen from West Coast Title. Please find wire instructions below.",
        "text": (
            "Hi,\n\n"
            "This is David Chen, your escrow officer at West Coast Title & Escrow.\n\n"
            "Please find the wire transfer instructions for 1605 Birchwood Court attached.\n"
            "If you have any questions, feel free to reply to this email or call David Chen "
            "directly at (714) 555-0283.\n\n"
            "Best regards,\n"
            "David Chen\n"
            "Senior Escrow Officer\n"
            "West Coast Title & Escrow"
        ),
    },
    "links": {"urls": [], "hosts": []},
    "signals": {
        "num_links":                  0,
        "has_unsubscribe":            False,
        "has_physical_address_hint":  False,
        "has_policy_footer_hint":     False,
        "cta_phrases":                [],
        "incentive_phrases":          [],
        "urgency_phrases":            [],
        "wire_payment_phrases":       ["wire transfer"],
        "vendor_hosts":               [],
    },
}

# Wire doc names a completely different escrow officer than the email
WIRE_TEXT_NAME_MISMATCH = """
WIRE TRANSFER INSTRUCTIONS
West Coast Title & Escrow

Escrow Officer: Margaret Sullivan
Direct Line: (714) 555-9901
Email: m.sullivan@westcoasttitle.com

Property: 1605 Birchwood Court
Closing Date: March 2, 2025
Amount: $398,500.00

WIRING INSTRUCTIONS:
Bank: Wells Fargo Bank
Routing Number: 121042882
Account Number: 6634829017
Beneficiary: West Coast Title Trust Account
"""


# ── Fixture 8: Punctuation obfuscation ────────────────────────────────────────
# Attacker uses dots, em dashes, interpuncts, and unusual spacing to break up
# keywords, preventing regex-based signal extractors from matching.
# wire_payment_phrases and urgency_phrases will be empty despite the intent.
# Gemini must detect the financial request from context alone.
FIXTURE_PUNCTUATION_OBFUSCATION = {
    "source": "gmail",
    "message_id": "18f4b2c3d4e50008",
    "thread_id":  "18f4b2c3d4e50008",
    "internal_date_ms": "1740250000000",
    "labels": ["INBOX", "UNREAD"],
    "headers": {
        "from_raw":   "Escrow Dept <escrow@sunriseclosings.net>",
        "from_email": "escrow@sunriseclosings.net",
        "from_name":  "Escrow Dept",
        "to":         "buyer@gmail.com",
        "subject":    "F\u00b7U\u00b7N\u00b7D\u00b7S  R\u00b7E\u00b7Q\u00b7U\u00b7I\u00b7R\u00b7E\u00b7D \u2014 Ref #20250301",
        "date":       "Sat, 01 Mar 2025 16:00:00 -0800",
        "reply_to":   "escrow@sunriseclosings.net",
        "return_path": "escrow@sunriseclosings.net",
        "list_id":    None,
        "list_unsubscribe":      [],
        "list_unsubscribe_post": None,
        "auth_summary": {
            "spf":   "neutral",
            "dkim":  "fail",
            "dmarc": "fail",
            "raw": "spf=neutral; dkim=fail; dmarc=fail",
        },
    },
    "content": {
        "snippet": "Kindly.send.your.closing.funds.today via the rou\u00b7ting below.",
        "text": (
            "Dear.Client,\n\n"
            "Kindly.remit.your.closing.funds.today using the following "
            "b\u00b7a\u00b7n\u00b7k  d\u00b7e\u00b7t\u00b7a\u00b7i\u00b7l\u00b7s:\n\n"
            "B-a-n-k \u2014 Sunrise.Trust.and.Savings\n"
            "R\u00b7o\u00b7u\u00b7t\u00b7i\u00b7n\u00b7g \u2014 0\u00b72\u00b76\u00b70\u00b70\u00b79\u00b75\u00b79\u00b73\n"
            "A\u00b7c\u00b7c\u00b7o\u00b7u\u00b7n\u00b7t \u2014 9\u00b78\u00b73\u00b71\u00b70\u00b72\u00b74\u00b77\u00b76\n"
            "A\u00b7m\u00b7o\u00b7u\u00b7n\u00b7t \u2014 $294.750.00\n\n"
            "This.is.time.sensitive. Failure.to.wire.funds.immediately "
            "will.result.in.closing.delay.\n\n"
            "D\u00b7o  n\u00b7o\u00b7t  c\u00b7a\u00b7l\u00b7l  t\u00b7o  v\u00b7e\u00b7r\u00b7i\u00b7f\u00b7y \u2014 "
            "reply.by.email.only.\n\n"
            "Regards,\n"
            "Sunrise.Closings.Dept"
        ),
    },
    "links": {"urls": [], "hosts": []},
    "signals": {
        # Intentionally empty — regex extractors cannot match punctuation-broken keywords
        "num_links":                  0,
        "has_unsubscribe":            False,
        "has_physical_address_hint":  False,
        "has_policy_footer_hint":     False,
        "cta_phrases":                [],
        "incentive_phrases":          [],
        "urgency_phrases":            [],
        "wire_payment_phrases":       [],
        "vendor_hosts":               [],
    },
}


# Matching wire doc text for fusion test (attacker-crafted document)
WIRE_TEXT_BEC = """
WIRE TRANSFER INSTRUCTIONS
First American Title & Escrow
Escrow Officer: Jennifer Walsh
Direct: (800) 555-0192
Email: j.walsh@firstam-title.net

Property: 4821 Maple Grove Drive
Closing Date: February 28, 2025
Amount Due: $412,500.00

WIRING INSTRUCTIONS:
Bank: Pacific Trust Bank
Routing: 026009593
Account: 8847201938
Beneficiary: First American Title Trust Account

IMPORTANT: These instructions have been updated. Previous instructions are void.
Wire funds immediately. Closing cannot proceed without receipt by 2:00 PM today.
Do not call to verify — contact only by email.
"""


# ── Fixture 2: Legitimate closing notification from First American ─────────────
# Sent via a real ESP from firstam.com. All auth passes.
FIXTURE_LEGIT_ESCROW = {
    "source": "gmail",
    "message_id": "18f3b4d7e8f20002",
    "thread_id":  "18f3b4d7e8f20002",
    "internal_date_ms": "1739900000000",
    "labels": ["INBOX"],
    "headers": {
        "from_raw":   "First American Title <notifications@firstam.com>",
        "from_email": "notifications@firstam.com",
        "from_name":  "First American Title",
        "to":         "buyer@gmail.com",
        "subject":    "Your Closing Documents are Ready - 4821 Maple Grove Dr",
        "date":       "Thu, 27 Feb 2025 14:22:11 -0800",
        "reply_to":   None,
        "return_path": "bounce@mail.firstam.com",
        "list_id":    "<closings.firstam.com>",
        "list_unsubscribe":      ["https://mail.firstam.com/unsubscribe?id=abc123"],
        "list_unsubscribe_post": "List-Unsubscribe=One-Click",
        "auth_summary": {
            "spf":   "pass",
            "dkim":  "pass",
            "dmarc": "pass",
            "raw": "spf=pass smtp.mailfrom=mail.firstam.com; dkim=pass header.d=firstam.com; dmarc=pass",
        },
    },
    "content": {
        "snippet": "Your closing documents for 4821 Maple Grove Dr are ready for review.",
        "text": (
            "Dear Valued Client,\n\n"
            "Your closing documents for the property at 4821 Maple Grove Drive are ready "
            "for your review in our secure portal.\n\n"
            "Please log in to review and sign your documents at your earliest convenience. "
            "Your escrow officer, Jennifer Walsh, will be in touch to confirm your closing appointment.\n\n"
            "If you have any questions, please contact our office directly at (800) 555-0192.\n\n"
            "First American Title & Escrow\n"
            "1 First American Way, Santa Ana, CA 92707\n\n"
            "This email was sent by First American Title Insurance Company. "
            "If you no longer wish to receive these emails, you may unsubscribe at any time.\n"
            "Privacy Policy | Terms of Service\n"
            "© 2025 First American Financial Corporation. All rights reserved."
        ),
    },
    "links": {
        "urls":  ["https://portal.firstam.com/closing/abc123"],
        "hosts": ["portal.firstam.com"],
    },
    "signals": {
        "num_links":                  1,
        "has_unsubscribe":            True,
        "has_physical_address_hint":  True,
        "has_policy_footer_hint":     True,
        "cta_phrases":                [],
        "incentive_phrases":          [],
        "urgency_phrases":            [],
        "wire_payment_phrases":       [],
        "vendor_hosts":               [],
    },
}


# ── Fixture 3: Suspicious mid-thread email with embedded wire instructions ─────
# Domain not a known lookalike but auth is mixed. Sent mid-thread to build trust.
FIXTURE_SUSPICIOUS_WIRE = {
    "source": "gmail",
    "message_id": "18f3c1a2b3c40003",
    "thread_id":  "18f3a1b2c3d40000",   # note: thread started legitimately
    "internal_date_ms": "1740050000000",
    "labels": ["INBOX", "UNREAD"],
    "headers": {
        "from_raw":   "Michael Torres <m.torres@quickclose-escrow.com>",
        "from_email": "m.torres@quickclose-escrow.com",
        "from_name":  "Michael Torres",
        "to":         "buyer@gmail.com",
        "subject":    "Re: Closing on 312 Sycamore Lane - Wire Instructions",
        "date":       "Fri, 28 Feb 2025 11:03:44 -0800",
        "reply_to":   "m.torres@quickclose-escrow.com",
        "return_path": "m.torres@quickclose-escrow.com",
        "list_id":    None,
        "list_unsubscribe":      [],
        "list_unsubscribe_post": None,
        "auth_summary": {
            "spf":   "pass",
            "dkim":  "fail",
            "dmarc": "fail",
            "raw": "spf=pass smtp.mailfrom=quickclose-escrow.com; dkim=fail; dmarc=fail",
        },
    },
    "content": {
        "snippet": "Please find the wire instructions for your closing below. Deadline is 3PM today.",
        "text": (
            "Hi,\n\n"
            "As discussed, please find the wire transfer instructions for your closing:\n\n"
            "Bank: Regional Commerce Bank\n"
            "ABA Routing: 111000614\n"
            "Account Number: 5502918847\n"
            "Beneficiary: QuickClose Escrow Trust\n"
            "Amount: $285,000.00\n"
            "Memo: 312 Sycamore Lane Closing\n\n"
            "Please wire today. The deadline to fund is 3:00 PM or closing will be delayed.\n\n"
            "Best,\n"
            "Michael Torres\n"
            "Senior Escrow Officer\n"
            "QuickClose Escrow Services"
        ),
    },
    "links": {
        "urls":  [],
        "hosts": [],
    },
    "signals": {
        "num_links":                  0,
        "has_unsubscribe":            False,
        "has_physical_address_hint":  False,
        "has_policy_footer_hint":     False,
        "cta_phrases":                [],
        "incentive_phrases":          [],
        "urgency_phrases":            ["today", "deadline"],
        "wire_payment_phrases":       ["wire transfer", "ABA Routing", "Account Number", "wire"],
        "vendor_hosts":               [],
    },
}


# ── Fixture 4: Benign marketing email (control / baseline) ────────────────────
FIXTURE_MARKETING = {
    "source": "gmail",
    "message_id": "18f3d5e6f7a80004",
    "thread_id":  "18f3d5e6f7a80004",
    "internal_date_ms": "1739800000000",
    "labels": ["INBOX", "PROMOTIONS"],
    "headers": {
        "from_raw":   "Zillow <newsletter@zillow.com>",
        "from_email": "newsletter@zillow.com",
        "from_name":  "Zillow",
        "to":         "buyer@gmail.com",
        "subject":    "3 new listings match your saved search in Irvine, CA",
        "date":       "Wed, 26 Feb 2025 08:00:00 -0800",
        "reply_to":   None,
        "return_path": "bounce@em.zillow.com",
        "list_id":    "<listings.zillow.com>",
        "list_unsubscribe":      ["https://www.zillow.com/unsubscribe/", "mailto:unsub@zillow.com"],
        "list_unsubscribe_post": "List-Unsubscribe=One-Click",
        "auth_summary": {
            "spf":   "pass",
            "dkim":  "pass",
            "dmarc": "pass",
            "raw": "spf=pass smtp.mailfrom=em.zillow.com; dkim=pass header.d=zillow.com; dmarc=pass",
        },
    },
    "content": {
        "snippet": "3 new listings in Irvine, CA match your saved search.",
        "text": (
            "Hi there,\n\n"
            "3 new listings match your saved search: 'Irvine, CA under $800K'.\n\n"
            "• 142 Barranca Ave, Irvine CA 92606 — $749,000 — 3 bed / 2 bath\n"
            "• 88 Nightshade, Irvine CA 92618 — $779,000 — 4 bed / 3 bath\n"
            "• 200 Spectrum, Irvine CA 92618 — $695,000 — 2 bed / 2 bath\n\n"
            "View all listings at zillow.com.\n\n"
            "You are receiving this email because you saved a search on Zillow. "
            "Unsubscribe | Privacy Policy\n"
            "© 2025 Zillow, Inc., 1301 Second Avenue, Floor 31, Seattle, WA 98101"
        ),
    },
    "links": {
        "urls":  ["https://www.zillow.com/homes/", "https://www.zillow.com/unsubscribe/"],
        "hosts": ["www.zillow.com"],
    },
    "signals": {
        "num_links":                  2,
        "has_unsubscribe":            True,
        "has_physical_address_hint":  True,
        "has_policy_footer_hint":     True,
        "cta_phrases":                [],
        "incentive_phrases":          [],
        "urgency_phrases":            [],
        "wire_payment_phrases":       [],
        "vendor_hosts":               [],
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════

REQUIRED_TOP_KEYS = {"behavioral_context", "risk_context", "report_ready_summary"}
REQUIRED_BC_KEYS  = {
    "message_type", "intent_summary", "sender_legitimacy_signals",
    "sender_risk_signals", "infrastructure_fingerprint",
    "persuasion_profile", "extracted_entities",
}
REQUIRED_RC_KEYS  = {
    "benign_likelihood", "phishing_likelihood", "wire_fraud_likelihood",
    "overall_risk", "rationale_bullets",
}
REQUIRED_RS_KEYS  = {"one_paragraph", "notable_patterns", "what_to_check_next"}

VALID_MESSAGE_TYPES = {
    "marketing", "transactional", "account_security",
    "financial", "legal", "personal", "unknown",
}
VALID_OVERALL_RISK = {"low", "medium", "high"}
VALID_AUTH_ALIGN   = {"strong", "mixed", "weak", "unknown"}
VALID_URGENCY      = {"none", "low", "medium", "high"}
VALID_CTA_DENSITY  = {"low", "medium", "high"}


def _assert_schema(result: dict, label: str) -> None:
    """Raise AssertionError if result doesn't match the required output schema."""
    assert REQUIRED_TOP_KEYS <= result.keys(), \
        f"[{label}] Missing top-level keys: {REQUIRED_TOP_KEYS - result.keys()}"

    bc = result["behavioral_context"]
    assert REQUIRED_BC_KEYS <= bc.keys(), \
        f"[{label}] Missing behavioral_context keys: {REQUIRED_BC_KEYS - bc.keys()}"
    assert bc["message_type"] in VALID_MESSAGE_TYPES, \
        f"[{label}] Invalid message_type: {bc['message_type']}"

    fp = bc["infrastructure_fingerprint"]
    assert fp["auth_alignment"] in VALID_AUTH_ALIGN, \
        f"[{label}] Invalid auth_alignment: {fp['auth_alignment']}"

    pp = bc["persuasion_profile"]
    assert pp["urgency"] in VALID_URGENCY, \
        f"[{label}] Invalid urgency: {pp['urgency']}"
    assert pp["cta_density"] in VALID_CTA_DENSITY, \
        f"[{label}] Invalid cta_density: {pp['cta_density']}"

    rc = result["risk_context"]
    assert REQUIRED_RC_KEYS <= rc.keys(), \
        f"[{label}] Missing risk_context keys: {REQUIRED_RC_KEYS - rc.keys()}"
    assert rc["overall_risk"] in VALID_OVERALL_RISK, \
        f"[{label}] Invalid overall_risk: {rc['overall_risk']}"

    total = rc["benign_likelihood"] + rc["phishing_likelihood"] + rc["wire_fraud_likelihood"]
    assert 0.85 <= total <= 1.15, \
        f"[{label}] Likelihoods don't sum to ~1.0 (got {total:.2f})"

    for bullet in rc["rationale_bullets"]:
        assert "claim" in bullet, f"[{label}] Rationale bullet missing 'claim'"
        assert "evidence_paths" in bullet and bullet["evidence_paths"], \
            f"[{label}] Rationale bullet missing evidence_paths: {bullet}"

    rs = result["report_ready_summary"]
    assert REQUIRED_RS_KEYS <= rs.keys(), \
        f"[{label}] Missing report_ready_summary keys: {REQUIRED_RS_KEYS - rs.keys()}"


def _print_result(label: str, result: dict) -> None:
    rc = result["risk_context"]
    bc = result["behavioral_context"]
    fp = bc["infrastructure_fingerprint"]
    pp = bc["persuasion_profile"]
    print(f"\n{'─'*60}")
    print(f"  {label}")
    print(f"{'─'*60}")
    print(f"  message_type  : {bc['message_type']}")
    print(f"  intent        : {bc['intent_summary']}")
    print(f"  auth_alignment: {fp['auth_alignment']}")
    print(f"  urgency       : {pp['urgency']}")
    print(f"  overall_risk  : {rc['overall_risk']}")
    print(f"  benign        : {rc['benign_likelihood']:.2f}")
    print(f"  phishing      : {rc['phishing_likelihood']:.2f}")
    print(f"  wire_fraud    : {rc['wire_fraud_likelihood']:.2f}")
    if rc["rationale_bullets"]:
        print("  rationale:")
        for b in rc["rationale_bullets"][:3]:
            print(f"    • {b['claim']}")
            print(f"      evidence: {b['evidence_paths']}")
    summary = result.get("report_ready_summary", {})
    if summary.get("notable_patterns"):
        print("  notable_patterns:")
        for p in summary["notable_patterns"][:3]:
            print(f"    ⚑ {p}")


def _print_fusion(label: str, fused: dict) -> None:
    fusion = fused.get("email_context_fusion", {})
    if not fusion:
        print(f"  [{label}] No fusion block (email context absent)")
        return
    fr = fusion.get("fused_risk", {})
    cs = fusion.get("cross_signals", [])
    print(f"\n  ── Fusion: {label} ──")
    print(f"  wire_risk_score           : {fr.get('wire_risk_score')}")
    print(f"  email_contribution_points : {fr.get('email_contribution_points')}")
    print(f"  fused_overall_score       : {fr.get('fused_overall_score')}")
    print(f"  fused_risk_tier           : {fr.get('fused_risk_tier')}")
    if cs:
        print("  cross_signals:")
        for s in cs:
            print(f"    [{s['severity'].upper()}] {s['signal']}: {s['description'][:80]}")
    actions = fr.get("recommended_actions", [])
    if actions:
        print("  recommended_actions:")
        for a in actions:
            print(f"    → {a}")


# ══════════════════════════════════════════════════════════════════════════════
# pytest test functions
# ══════════════════════════════════════════════════════════════════════════════

def test_schema_bec_wire_fraud():
    """BEC attack: schema is valid and output has correct shape."""
    result = analyze_email(FIXTURE_BEC_WIRE_FRAUD)
    _assert_schema(result, "BEC_WIRE_FRAUD")


def test_risk_bec_wire_fraud():
    """BEC attack: wire_fraud_likelihood must be dominant and overall_risk high."""
    result = analyze_email(FIXTURE_BEC_WIRE_FRAUD)
    rc = result["risk_context"]
    assert rc["wire_fraud_likelihood"] >= 0.40, \
        f"Expected wire_fraud_likelihood >= 0.40, got {rc['wire_fraud_likelihood']}"
    assert rc["overall_risk"] in ("medium", "high"), \
        f"Expected medium or high risk for BEC, got {rc['overall_risk']}"
    bc = result["behavioral_context"]
    assert bc["infrastructure_fingerprint"]["auth_alignment"] in ("weak",), \
        f"Auth should be weak for all-fail auth, got {bc['infrastructure_fingerprint']['auth_alignment']}"


def test_schema_legit_escrow():
    """Legitimate escrow email: schema is valid."""
    result = analyze_email(FIXTURE_LEGIT_ESCROW)
    _assert_schema(result, "LEGIT_ESCROW")


def test_risk_legit_escrow():
    """Legitimate escrow email: benign_likelihood must dominate, risk must be low."""
    result = analyze_email(FIXTURE_LEGIT_ESCROW)
    rc = result["risk_context"]
    assert rc["benign_likelihood"] >= 0.60, \
        f"Expected benign_likelihood >= 0.60, got {rc['benign_likelihood']}"
    assert rc["overall_risk"] in ("low", "medium"), \
        f"Expected low or medium risk for legit email, got {rc['overall_risk']}"
    bc = result["behavioral_context"]
    assert bc["infrastructure_fingerprint"]["auth_alignment"] in ("strong", "mixed"), \
        f"Auth should be strong for all-pass email, got {bc['infrastructure_fingerprint']['auth_alignment']}"


def test_schema_suspicious_wire():
    """Suspicious mid-thread wire email: schema is valid."""
    result = analyze_email(FIXTURE_SUSPICIOUS_WIRE)
    _assert_schema(result, "SUSPICIOUS_WIRE")


def test_risk_suspicious_wire():
    """Suspicious wire email: wire_fraud or phishing should be elevated."""
    result = analyze_email(FIXTURE_SUSPICIOUS_WIRE)
    rc = result["risk_context"]
    elevated = rc["wire_fraud_likelihood"] + rc["phishing_likelihood"]
    assert elevated >= 0.35, \
        f"Expected combined threat likelihood >= 0.35, got {elevated:.2f}"


def test_schema_marketing():
    """Marketing email: schema is valid."""
    result = analyze_email(FIXTURE_MARKETING)
    _assert_schema(result, "MARKETING")


def test_risk_marketing():
    """Marketing email: must be classified as marketing/low-risk."""
    result = analyze_email(FIXTURE_MARKETING)
    rc = result["risk_context"]
    bc = result["behavioral_context"]
    assert rc["benign_likelihood"] >= 0.70, \
        f"Expected benign_likelihood >= 0.70 for marketing email, got {rc['benign_likelihood']}"
    assert bc["message_type"] in ("marketing", "transactional"), \
        f"Expected message_type=marketing or transactional, got {bc['message_type']}"
    assert rc["overall_risk"] == "low", \
        f"Expected low risk for marketing email, got {rc['overall_risk']}"


def test_fusion_bec_with_wire_doc():
    """Full fusion: BEC email + matching wire doc → critical fused tier."""
    wire_result = parse_text(WIRE_TEXT_BEC)
    result = fuse(wire_result, FIXTURE_BEC_WIRE_FRAUD)

    assert "email_context_fusion" in result, "Fusion key missing from result"

    fusion = result["email_context_fusion"]
    assert "behavioral_context" in fusion
    assert "cross_signals" in fusion
    assert "fused_risk" in fusion

    fr = fusion["fused_risk"]
    assert fr["fused_risk_tier"] in ("high", "critical"), \
        f"Expected high or critical fused tier for BEC+wire, got {fr['fused_risk_tier']}"
    assert fr["fused_overall_score"] >= 50, \
        f"Expected fused score >= 50, got {fr['fused_overall_score']}"


def test_fusion_no_email_passthrough():
    """Without email context, fuse() must return wire_result unchanged."""
    wire_result = parse_text(WIRE_TEXT_BEC)
    result = fuse(wire_result, normalized_email=None)
    assert "email_context_fusion" not in result, \
        "fuse() must not add email_context_fusion when normalized_email is None"
    # Verify it's the exact same object
    assert result is wire_result


def test_schema_unicode_homograph():
    """Unicode homograph attack: schema is valid despite empty signal arrays."""
    result = analyze_email(FIXTURE_UNICODE_HOMOGRAPH)
    _assert_schema(result, "UNICODE_HOMOGRAPH")


def test_risk_unicode_homograph():
    """Unicode homograph: Gemini must detect wire fraud intent from obfuscated chars."""
    result = analyze_email(FIXTURE_UNICODE_HOMOGRAPH)
    rc = result["risk_context"]
    elevated = rc["wire_fraud_likelihood"] + rc["phishing_likelihood"]
    assert elevated >= 0.30, (
        f"Expected combined threat likelihood >= 0.30 despite empty signal arrays, "
        f"got {elevated:.2f} (wire={rc['wire_fraud_likelihood']:.2f}, "
        f"phishing={rc['phishing_likelihood']:.2f})"
    )
    bc = result["behavioral_context"]
    assert bc["infrastructure_fingerprint"]["auth_alignment"] in ("weak",), (
        f"All-fail auth should yield 'weak' alignment, "
        f"got {bc['infrastructure_fingerprint']['auth_alignment']}"
    )


def test_schema_bank_mismatch():
    """Bank mismatch email: schema is valid."""
    result = analyze_email(FIXTURE_BANK_MISMATCH_EMAIL)
    _assert_schema(result, "BANK_MISMATCH")


def test_fusion_bank_mismatch():
    """Bank mismatch: wire parser must catch routing→bank name discrepancy."""
    wire_result = parse_text(WIRE_TEXT_BANK_MISMATCH)
    # Wire doc claims JPMorgan Chase but routing 021000089 belongs to Citibank.
    # The wire parser's bank lookup should flag this.
    hs = wire_result.get("hackathon_schema") or {}
    ra = hs.get("risk_assessment") or {}
    score = ra.get("overall_risk_score", 0)
    assert score >= 25, (
        f"Expected risk score >= 25 for bank name mismatch, got {score}"
    )
    # Fused result should be at least medium risk
    fused = fuse(wire_result, FIXTURE_BANK_MISMATCH_EMAIL)
    assert "email_context_fusion" in fused, "Fusion key missing from result"
    fr = fused["email_context_fusion"]["fused_risk"]
    assert fr["fused_risk_tier"] in ("medium", "high", "critical"), (
        f"Expected elevated fused tier for bank mismatch, got {fr['fused_risk_tier']}"
    )


def test_schema_name_mismatch():
    """Escrow officer name mismatch email: schema is valid."""
    result = analyze_email(FIXTURE_NAME_MISMATCH_EMAIL)
    _assert_schema(result, "NAME_MISMATCH")


def test_fusion_name_mismatch():
    """Name mismatch: ESCROW_OFFICER_NOT_IN_EMAIL cross-signal must fire."""
    wire_result = parse_text(WIRE_TEXT_NAME_MISMATCH)
    fused = fuse(wire_result, FIXTURE_NAME_MISMATCH_EMAIL)
    assert "email_context_fusion" in fused, "Fusion key missing from result"
    fusion = fused["email_context_fusion"]
    cross_signals = [s["signal"] for s in fusion.get("cross_signals", [])]
    assert "ESCROW_OFFICER_NOT_IN_EMAIL" in cross_signals, (
        f"Expected ESCROW_OFFICER_NOT_IN_EMAIL cross-signal for name mismatch. "
        f"Got: {cross_signals}"
    )


def test_schema_punctuation_obfuscation():
    """Punctuation obfuscation email: schema is valid despite empty signal arrays."""
    result = analyze_email(FIXTURE_PUNCTUATION_OBFUSCATION)
    _assert_schema(result, "PUNCTUATION_OBFUSCATION")


def test_risk_punctuation_obfuscation():
    """Punctuation obfuscation: Gemini must detect wire fraud intent from context."""
    result = analyze_email(FIXTURE_PUNCTUATION_OBFUSCATION)
    rc = result["risk_context"]
    elevated = rc["wire_fraud_likelihood"] + rc["phishing_likelihood"]
    assert elevated >= 0.30, (
        f"Expected combined threat likelihood >= 0.30 despite obfuscated keywords, "
        f"got {elevated:.2f}"
    )
    assert rc["overall_risk"] in ("medium", "high"), (
        f"Expected medium or high risk for obfuscated wire fraud email, "
        f"got {rc['overall_risk']}"
    )


# ══════════════════════════════════════════════════════════════════════════════
# Direct runner (prints readable output for all scenarios)
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    scenarios = [
        ("1 — BEC Wire Fraud (spoofed escrow, all auth fail)",  FIXTURE_BEC_WIRE_FRAUD),
        ("2 — Legitimate First American closing notification",   FIXTURE_LEGIT_ESCROW),
        ("3 — Suspicious mid-thread wire instructions",          FIXTURE_SUSPICIOUS_WIRE),
        ("4 — Zillow marketing email (control)",                 FIXTURE_MARKETING),
        ("5 — Unicode / homograph attack (Cyrillic lookalikes)", FIXTURE_UNICODE_HOMOGRAPH),
        ("6 — Bank name mismatch (routing→wrong bank)",          FIXTURE_BANK_MISMATCH_EMAIL),
        ("7 — Escrow officer name mismatch (email vs wire doc)", FIXTURE_NAME_MISMATCH_EMAIL),
        ("8 — Punctuation obfuscation (broken keywords)",        FIXTURE_PUNCTUATION_OBFUSCATION),
    ]

    print("\n" + "═" * 60)
    print("  BEHAVIORAL CONTEXT — EMAIL ANALYSIS RESULTS")
    print("═" * 60)

    results = {}
    for label, fixture in scenarios:
        print(f"\nAnalyzing: {label}...")
        r = analyze_email(fixture)
        results[label] = r
        _print_result(label, r)

    # ── Fusion test: BEC email + wire doc ────────────────────────────────────
    print("\n\n" + "═" * 60)
    print("  FUSION TEST — BEC EMAIL + WIRE TRANSFER DOC")
    print("═" * 60)
    print("\nRunning wire parser on fraud document...")
    wire_result = parse_text(WIRE_TEXT_BEC)
    wire_ra = (wire_result.get("hackathon_schema") or {}).get("risk_assessment") or {}
    print(f"  wire_only risk score : {wire_ra.get('overall_risk_score')} ({wire_ra.get('risk_tier')})")

    print("Fusing with BEC email context...")
    fused = fuse(wire_result, FIXTURE_BEC_WIRE_FRAUD)
    _print_fusion("BEC email + wire doc", fused)

    # ── Fusion test: Bank mismatch ────────────────────────────────────────────
    print("\n" + "═" * 60)
    print("  FUSION TEST — BANK NAME MISMATCH (routing→wrong bank)")
    print("═" * 60)
    print("\nRunning wire parser on bank mismatch document...")
    wire_bm = parse_text(WIRE_TEXT_BANK_MISMATCH)
    bm_ra = (wire_bm.get("hackathon_schema") or {}).get("risk_assessment") or {}
    print(f"  wire_only risk score : {bm_ra.get('overall_risk_score')} ({bm_ra.get('risk_tier')})")
    print("Fusing with bank mismatch email context...")
    fused_bm = fuse(wire_bm, FIXTURE_BANK_MISMATCH_EMAIL)
    _print_fusion("Bank mismatch email + wire doc", fused_bm)

    # ── Fusion test: Name mismatch ────────────────────────────────────────────
    print("\n" + "═" * 60)
    print("  FUSION TEST — ESCROW OFFICER NAME MISMATCH")
    print("═" * 60)
    print("\nRunning wire parser on name mismatch document...")
    wire_nm = parse_text(WIRE_TEXT_NAME_MISMATCH)
    nm_ra = (wire_nm.get("hackathon_schema") or {}).get("risk_assessment") or {}
    print(f"  wire_only risk score : {nm_ra.get('overall_risk_score')} ({nm_ra.get('risk_tier')})")
    print("Fusing with name mismatch email context...")
    fused_nm = fuse(wire_nm, FIXTURE_NAME_MISMATCH_EMAIL)
    _print_fusion("Name mismatch email + wire doc", fused_nm)
    nm_signals = [s["signal"] for s in fused_nm.get("email_context_fusion", {}).get("cross_signals", [])]
    print(f"  cross_signals fired : {nm_signals}")

    # ── Passthrough test ─────────────────────────────────────────────────────
    print("\n" + "═" * 60)
    print("  PASSTHROUGH TEST — wire only, no email context")
    print("═" * 60)
    passthrough = fuse(wire_result, normalized_email=None)
    has_fusion  = "email_context_fusion" in passthrough
    print(f"\n  email_context_fusion present: {has_fusion} (expected: False)")
    assert not has_fusion, "FAIL: fuse() added fusion key when no email was provided"
    print("  PASS: wire_result returned unchanged")

    print("\n\nAll scenarios complete.\n")