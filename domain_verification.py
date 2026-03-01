import os
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Optional

import dns.resolver
import requests
from dotenv import load_dotenv

from enrichment.domain_age import get_domain_created_date
from risk_scoring import FREE_EMAIL_DOMAINS, KNOWN_LEGIT_DOMAINS

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")


class DomainVerifier:

    def __init__(self):
        self.known_legitimate = KNOWN_LEGIT_DOMAINS

    # ── eTLD+1 normalisation ───────────────────────────────────────────────────

    @staticmethod
    def _registered_domain(domain: str) -> str:
        """
        Return the eTLD+1 for a domain, stripping subdomains.
        e.g. 'mail.firstam.com' → 'firstam.com'
        """
        parts = domain.lower().strip(".").split(".")
        if len(parts) <= 2:
            return domain.lower()
        # Heuristic for ccTLDs like .co.uk, .com.au
        if len(parts[-2]) <= 2:
            return ".".join(parts[-3:])
        return ".".join(parts[-2:])

    # ── Public entry points ────────────────────────────────────────────────────

    def verify(self, domain: str) -> dict:
        """Run all checks against a single domain string."""
        domain = self._registered_domain(domain)
        results = {"domain": domain, "checks": {}, "risk_score": 0}

        results["checks"]["domain_age"]   = self._check_domain_age(domain)
        results["checks"]["lookalike"]    = self._check_lookalike(domain)
        results["checks"]["mx_records"]   = self._check_mx_records(domain)
        results["checks"]["email_auth"]   = self._check_email_auth(domain)
        results["checks"]["safe_browsing"] = self._check_safe_browsing(domain)

        results["risk_score"] = self._calculate_risk(results["checks"])
        return results

    def verify_extracted(self, extracted: dict) -> dict:
        """
        Run domain checks using the structured output from the LLM extractor.
        Adds extra risk signals derived from the extracted wire data.

        Priority for primary domain:
            1. internet_data.domains[0]
            2. escrow_officer.domains[0]
            3. domain parsed from escrow_officer.email
        """
        internet_domains: list = (extracted.get("internet_data") or {}).get("domains", [])
        escrow_email: Optional[str] = (
            (extracted.get("communication") or {}).get("sender_email")
            or (extracted.get("escrow_contact") or {}).get("email")
        )

        domain: Optional[str] = None
        if internet_domains:
            domain = internet_domains[0]
        elif escrow_email and "@" in escrow_email:
            domain = escrow_email.split("@", 1)[1]

        if not domain:
            return {
                "domain": None,
                "checks": {},
                "risk_score": 0,
                "error": "No domain found in extracted data",
                "llm_red_flags": extracted.get("red_flags", []),
            }

        # Standard domain checks
        result = self.verify(domain)

        # Additional signals from extracted content
        wire = extracted.get("wire_details") or {}
        result["checks"]["missing_fields"] = self._check_missing_fields(wire)
        result["checks"]["free_email"]     = self._check_free_email_domain(
            self._registered_domain(domain)
        )
        result["checks"]["llm_red_flags"]  = self._check_llm_red_flags(
            extracted.get("red_flags", [])
        )

        result["risk_score"]    = self._calculate_risk(result["checks"])
        result["llm_red_flags"] = extracted.get("red_flags", [])
        return result

    # ── Domain-age check (delegates to enrichment.domain_age) ─────────────────

    def _check_domain_age(self, domain: str) -> dict:
        exists, created_dt, source, error = get_domain_created_date(domain)

        if exists is False:
            return {
                "exists": False,
                "creation_date": None,
                "age_days": None,
                "source": source,
                "risk_contribution": 90,
            }

        if exists is None:
            return {
                "exists": "unknown",
                "creation_date": None,
                "age_days": None,
                "source": source,
                "error": error,
                "risk_contribution": 20,
            }

        creation_iso: Optional[str] = created_dt.isoformat() if created_dt else None
        age_days: Optional[int] = None
        if created_dt:
            age_days = (datetime.now(timezone.utc) - created_dt).days

        if age_days is None:
            risk = 20
        elif age_days <= 30:
            risk = 60
        elif age_days < 90:
            risk = 25
        elif age_days < 365:
            risk = 10
        else:
            risk = 0

        return {
            "exists": True,
            "creation_date": creation_iso,
            "age_days": age_days,
            "source": source,
            "risk_contribution": risk,
        }

    # ── Lookalike / typosquat check ────────────────────────────────────────────

    def _check_lookalike(self, domain: str) -> dict:
        base_domain = domain.split(".")[0].lower()
        best_match = None
        highest_similarity = 0.0

        for legit in self.known_legitimate:
            legit_base = legit.split(".")[0].lower()
            similarity = SequenceMatcher(None, base_domain, legit_base).ratio()
            if similarity > highest_similarity and domain != legit:
                highest_similarity = similarity
                best_match = legit

        risk = 35 if highest_similarity > 0.8 else 0
        return {
            "closest_legitimate": best_match,
            "similarity": round(highest_similarity, 3),
            "risk_contribution": risk,
        }

    # ── MX records ────────────────────────────────────────────────────────────

    def _check_mx_records(self, domain: str) -> dict:
        try:
            mx_records = dns.resolver.resolve(domain, "MX")
            mx_hosts = [str(r.exchange).lower() for r in mx_records]

            reputable_providers = [
                "google.com", "googlemail.com",
                "outlook.com", "microsoft.com",
                "pphosted.com",
            ]
            uses_reputable = any(
                any(p in mx for p in reputable_providers)
                for mx in mx_hosts
            )
            return {
                "has_mx": True,
                "mx_hosts": mx_hosts,
                "reputable_provider": uses_reputable,
                "risk_contribution": 0 if uses_reputable else 10,
            }
        except dns.resolver.NXDOMAIN:
            return {"has_mx": False, "risk_contribution": 25}
        except Exception:
            return {"has_mx": None, "risk_contribution": 15}

    # ── SPF / DMARC ───────────────────────────────────────────────────────────

    def _check_email_auth(self, domain: str) -> dict:
        results = {"spf": False, "dmarc": False, "risk_contribution": 0}
        try:
            spf = dns.resolver.resolve(domain, "TXT")
            results["spf"] = any("v=spf1" in str(r) for r in spf)
        except Exception:
            pass

        try:
            dmarc = dns.resolver.resolve(f"_dmarc.{domain}", "TXT")
            results["dmarc"] = any("v=DMARC1" in str(r) for r in dmarc)
        except Exception:
            pass

        if not results["spf"] and not results["dmarc"]:
            results["risk_contribution"] = 15
        elif not results["spf"] or not results["dmarc"]:
            results["risk_contribution"] = 5
        return results

    # ── Google Safe Browsing ──────────────────────────────────────────────────

    def _check_safe_browsing(self, domain: str) -> dict:
        api_key = GOOGLE_API_KEY
        if not api_key:
            return {"flagged": None, "risk_contribution": 0}

        url = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
        payload = {
            "client": {"clientId": "keyready", "clientVersion": "1.0"},
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": f"https://{domain}"}],
            },
        }
        try:
            resp = requests.post(f"{url}?key={api_key}", json=payload, timeout=10)
            matches = resp.json().get("matches", [])
            return {"flagged": len(matches) > 0, "risk_contribution": 40 if matches else 0}
        except Exception:
            return {"flagged": None, "risk_contribution": 0}

    # ── Extra checks used by verify_extracted() ───────────────────────────────

    def _check_free_email_domain(self, domain: str) -> dict:
        is_free = domain.lower() in FREE_EMAIL_DOMAINS
        return {"is_free_provider": is_free, "risk_contribution": 25 if is_free else 0}

    def _check_missing_fields(self, wire: dict) -> dict:
        """Penalise missing wire-critical fields."""
        penalties = {"routing_number": 15, "bank_name": 10, "beneficiary_name": 5}
        missing = [k for k in penalties if not wire.get(k)]
        risk = min(sum(penalties[k] for k in missing), 25)
        return {"missing_fields": missing, "risk_contribution": risk}

    def _check_llm_red_flags(self, red_flags: list) -> dict:
        """Each LLM-detected red flag adds 10 risk points (max 30)."""
        risk = min(len(red_flags) * 10, 30)
        return {"flags": red_flags, "count": len(red_flags), "risk_contribution": risk}

    # ── Aggregation ───────────────────────────────────────────────────────────

    def _calculate_risk(self, checks: dict) -> int:
        total = sum(c.get("risk_contribution", 0) for c in checks.values())
        return min(total, 100)

