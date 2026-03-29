from __future__ import annotations

# Document collection order per tariff (internal keys)

FOOT_BIKE_DOCS = [
    "passport",
    "phone",
    "patent_front",
    "patent_back",
    "registration",
    "migration",
    "receipt_first",
    "receipt_last",
    "bank",
]

CAR_TRUCK_DOCS = [
    "passport",
    "license",
    "sts",
    "phone",
    "patent_front",
    "patent_back",
    "registration",
    "migration",
    "receipt_first",
    "receipt_last",
    "bank",
]


def required_doc_keys(tariff: str) -> list[str]:
    if tariff in ("car", "truck"):
        return list(CAR_TRUCK_DOCS)
    return list(FOOT_BIKE_DOCS)


def is_photo_doc(doc_key: str) -> bool:
    return doc_key not in ("phone", "bank")


def next_pending(completed: list[str], tariff: str) -> str | None:
    for k in required_doc_keys(tariff):
        if k not in completed:
            return k
    return None
