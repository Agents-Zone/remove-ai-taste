#!/usr/bin/env python3
"""Verify that protected factual spans survived a prose rewrite unchanged."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path


AUTOMATIC_PATTERNS = (
    r"(?ms)^[ \t]*(?:```|~~~).*?^[ \t]*(?:```|~~~)[ \t]*$",
    r"!?\[[^\]\n]*\]\([^)]+\)",
    r"`+[^`\n]+`+",
    r"“[^”\n]+”|‘[^’\n]+’|\"[^\"\n]+\"",
    r"https?://[^\s)\]}>]+",
    r"(?<!\w)(?:¥|￥|\$|€|£)\s?\d[\d,]*(?:\.\d+)?",
    r"(?<!\w)\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}日?(?!\w)",
    r"(?<!\w)\d+(?:\.\d+)?%",
    r"(?<![\w.])\d+(?:\.\d+){1,3}(?![\w.])",
    r"(?<![\w.,])\d[\d,]*(?:\.\d+)?(?![\w.])",
)


def extract_automatic_spans(text: str) -> list[str]:
    spans: list[tuple[int, int, str]] = []
    for pattern in AUTOMATIC_PATTERNS:
        for match in re.finditer(pattern, text):
            overlaps = any(
                match.start() < end and match.end() > start
                for start, end, _ in spans
            )
            if not overlaps:
                spans.append((match.start(), match.end(), match.group(0)))
    spans.sort(key=lambda item: item[0])
    return [span for _, _, span in spans]


def missing_spans(
    original: str,
    revised: str,
    explicit_spans: list[str] | None = None,
) -> list[str]:
    expected = extract_automatic_spans(original)
    expected.extend(explicit_spans or [])
    expected_counts = Counter(span for span in expected if span)
    missing: list[str] = []
    for span, count in expected_counts.items():
        revised_count = revised.count(span)
        if revised_count < count:
            missing.extend([span] * (count - revised_count))
    return missing


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Check that URLs, dates, amounts, percentages, code, quotations, "
            "and explicitly protected strings remain unchanged after rewriting."
        )
    )
    parser.add_argument("original", type=Path)
    parser.add_argument("revised", type=Path)
    parser.add_argument(
        "--protect",
        action="append",
        default=[],
        help="Additional exact string to preserve; repeat as needed",
    )
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        dest="output_format",
    )
    args = parser.parse_args()

    for path in (args.original, args.revised):
        if not path.exists():
            parser.error(f"file not found: {path}")

    original = args.original.read_text(encoding="utf-8")
    revised = args.revised.read_text(encoding="utf-8")
    missing = missing_spans(original, revised, args.protect)

    if args.output_format == "json":
        print(
            json.dumps(
                {"passed": not missing, "missing": missing},
                ensure_ascii=False,
                indent=2,
            )
        )
    elif missing:
        print("Protected spans missing or changed:")
        for span in missing:
            print(f"- {span}")
    else:
        print("All protected spans remain unchanged.")
    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
