"""
enrichment/domain_age.py
------------------------
Domain creation-date lookup via RDAP (IANA bootstrap) with WHOIS fallback.
Includes an in-memory TTL cache to avoid hammering external services.

Public API:
    get_domain_created_date(domain) -> (exists, created_dt, source, error)
"""

import time
from datetime import datetime, timezone
from threading import Lock
from typing import Optional

import requests

# ── IANA RDAP bootstrap ────────────────────────────────────────────────────────

_IANA_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json"
_BOOTSTRAP_TTL = 86_400          # 24 h in seconds
_DOMAIN_CACHE_TTL = 3_600        # 1 h per-domain result


# ── Thread-safe TTL cache ──────────────────────────────────────────────────────

class _TTLCache:
    def __init__(self, ttl: int) -> None:
        self._cache: dict[str, tuple] = {}
        self._ttl = ttl
        self._lock = Lock()

    def get(self, key: str):
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None
            value, ts = entry
            if time.monotonic() - ts < self._ttl:
                return value
            del self._cache[key]
            return None

    def set(self, key: str, value) -> None:
        with self._lock:
            self._cache[key] = (value, time.monotonic())


_bootstrap_cache = _TTLCache(ttl=_BOOTSTRAP_TTL)
_domain_cache    = _TTLCache(ttl=_DOMAIN_CACHE_TTL)


# ── RDAP helpers ───────────────────────────────────────────────────────────────

def _get_rdap_base_url(domain: str) -> Optional[str]:
    """Return the RDAP base URL for the domain's TLD via IANA bootstrap."""
    bootstrap = _bootstrap_cache.get("iana")
    if bootstrap is None:
        try:
            resp = requests.get(_IANA_BOOTSTRAP_URL, timeout=10)
            resp.raise_for_status()
            bootstrap = resp.json()
            _bootstrap_cache.set("iana", bootstrap)
        except Exception:
            return None

    tld = domain.rsplit(".", 1)[-1].lower()
    for entry in bootstrap.get("services", []):
        tlds, base_urls = entry
        if tld in [t.lower() for t in tlds]:
            return base_urls[0].rstrip("/")
    return None


def _rdap_lookup(domain: str) -> tuple[Optional[bool], Optional[datetime], Optional[str]]:
    """
    Query RDAP for domain.
    Returns (exists, created_datetime, error_message).
    exists=None means the lookup itself failed (unknown).
    """
    base_url = _get_rdap_base_url(domain)
    if base_url is None:
        return None, None, "RDAP bootstrap unavailable"

    url = f"{base_url}/domain/{domain}"
    try:
        resp = requests.get(url, timeout=10)
    except Exception as exc:
        return None, None, f"RDAP request error: {exc}"

    if resp.status_code == 404:
        return False, None, None

    if resp.status_code != 200:
        return None, None, f"RDAP HTTP {resp.status_code}"

    data = resp.json()
    created_dt: Optional[datetime] = None
    for event in data.get("events", []):
        if event.get("eventAction") == "registration":
            raw_date = event.get("eventDate")
            if raw_date:
                try:
                    created_dt = datetime.fromisoformat(
                        raw_date.replace("Z", "+00:00")
                    )
                    if created_dt.tzinfo is None:
                        created_dt = created_dt.replace(tzinfo=timezone.utc)
                except ValueError:
                    pass
            break

    return True, created_dt, None


# ── WHOIS fallback ─────────────────────────────────────────────────────────────

def _whois_lookup(domain: str) -> tuple[Optional[bool], Optional[datetime], Optional[str]]:
    """Try python-whois as a fallback. Returns (exists, created_dt, error)."""
    try:
        import whois  # pip install python-whois
    except ImportError:
        return None, None, "python-whois not installed"

    try:
        w = whois.whois(domain)
        creation = w.creation_date
        if isinstance(creation, list):
            creation = creation[0]
        if isinstance(creation, datetime):
            if creation.tzinfo is None:
                creation = creation.replace(tzinfo=timezone.utc)
            return True, creation, None
        return True, None, "WHOIS returned no creation date"
    except Exception as exc:
        return None, None, f"WHOIS error: {exc}"


# ── Public API ─────────────────────────────────────────────────────────────────

def get_domain_created_date(
    domain: str,
) -> tuple[Optional[bool], Optional[datetime], str, Optional[str]]:
    """
    Look up when a domain was registered.

    Returns:
        (exists, created_datetime, source, error)

        exists  – True  = domain exists
                  False = domain does not exist (RDAP 404)
                  None  = lookup failed, result unknown
        created_datetime – UTC-aware datetime or None
        source  – "rdap" | "whois" | "cache" | "unknown"
        error   – human-readable error string or None
    """
    cached = _domain_cache.get(domain)
    if cached is not None:
        exists, created, source, error = cached
        return exists, created, "cache", error

    # 1. Try RDAP
    exists, created, error = _rdap_lookup(domain)
    if exists is not None:          # definitive answer (True or False)
        _domain_cache.set(domain, (exists, created, "rdap", error))
        return exists, created, "rdap", error

    # 2. RDAP inconclusive → try WHOIS
    w_exists, w_created, w_error = _whois_lookup(domain)
    if w_exists is not None:
        _domain_cache.set(domain, (w_exists, w_created, "whois", w_error))
        return w_exists, w_created, "whois", w_error

    # 3. Both failed
    combined_error = "; ".join(filter(None, [error, w_error])) or "all lookups failed"
    _domain_cache.set(domain, (None, None, "unknown", combined_error))
    return None, None, "unknown", combined_error
