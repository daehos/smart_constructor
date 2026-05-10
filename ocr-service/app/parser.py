"""
Heuristic receipt parser for Indonesian receipts (Indomaret, Alfamart, restaurants, etc.)

Input : list of OCR line dicts  [{text, confidence, bbox}]
Output: parsed dict with merchant, date, items, subtotal, tax, total, currency
"""
import re
from typing import Any


_DATE_PATTERNS = [
    re.compile(r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b"),
    re.compile(r"\b(\d{4})[/\-.](\d{2})[/\-.](\d{2})\b"),
]

_TOTAL_KEYWORDS = re.compile(
    r"\b(grand\s*total|total\s*bayar|total\s*tagihan|total|subtotal)\b",
    re.IGNORECASE,
)
_TAX_KEYWORDS = re.compile(r"\b(ppn|tax|pajak|vat)\b", re.IGNORECASE)
_SUBTOTAL_KEYWORDS = re.compile(r"\b(subtotal|sub\s*total)\b", re.IGNORECASE)
_PRICE_RE = re.compile(r"([\d.,]{3,})")
_SKIP_LINE_RE = re.compile(
    r"(terima\s*kasih|thank\s*you|struk|receipt|kasir|cashier|member|npwp|^rp\.?$|^\*+$)",
    re.IGNORECASE,
)


def _extract_number(text: str) -> int | None:
    """Return the rightmost numeric-looking token as an integer, or None."""
    candidates = _PRICE_RE.findall(text)
    if not candidates:
        return None
    raw = candidates[-1].replace(".", "").replace(",", "")
    try:
        return int(raw)
    except ValueError:
        return None


def _extract_date(texts: list[str]) -> str | None:
    for text in texts:
        for pat in _DATE_PATTERNS:
            m = pat.search(text)
            if m:
                g = m.groups()
                if len(g) == 3:
                    if len(g[0]) == 4:
                        return f"{g[0]}-{g[1].zfill(2)}-{g[2].zfill(2)}"
                    year = g[2] if len(g[2]) == 4 else "20" + g[2]
                    return f"{year}-{g[1].zfill(2)}-{g[0].zfill(2)}"
    return None


def _is_item_line(text: str) -> bool:
    if _TOTAL_KEYWORDS.search(text):
        return False
    if _TAX_KEYWORDS.search(text):
        return False
    if _SKIP_LINE_RE.search(text):
        return False
    return bool(_PRICE_RE.search(text))


def parse_receipt(lines: list[dict[str, Any]]) -> dict[str, Any]:
    texts = [line["text"] for line in lines]

    merchant: str | None = None
    for t in texts[:5]:
        cleaned = t.strip()
        if cleaned and not _SKIP_LINE_RE.search(cleaned) and not _extract_number(cleaned):
            merchant = cleaned
            break

    date = _extract_date(texts)

    items: list[dict] = []
    total: int | None = None
    subtotal: int | None = None
    tax: int | None = None

    for text in texts:
        stripped = text.strip()
        if not stripped:
            continue

        if _TOTAL_KEYWORDS.search(stripped):
            val = _extract_number(stripped)
            if val is not None:
                if _SUBTOTAL_KEYWORDS.search(stripped):
                    subtotal = val
                else:
                    total = max(total or 0, val)
            continue

        if _TAX_KEYWORDS.search(stripped):
            val = _extract_number(stripped)
            if val is not None:
                tax = val
            continue

        if _is_item_line(stripped):
            price = _extract_number(stripped)
            name_part = _PRICE_RE.sub("", stripped).strip().rstrip("xX0-9").strip()
            if name_part and price and price > 0:
                items.append({
                    "name": name_part,
                    "qty": 1,
                    "price": price,
                    "subtotal": price,
                })

    if total is None and subtotal is not None:
        total = subtotal
    if subtotal is None and total is not None:
        subtotal = total

    return {
        "merchant": merchant,
        "date": date,
        "items": items,
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
        "currency": "IDR",
    }
