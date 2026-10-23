#!/usr/bin/env python3
"""Diagnose common AI-writing fingerprints without rewriting the source.

The scanner is deliberately conservative. It masks Markdown regions that
should not be edited, separates phrase checks from structure checks, and
reports clusters instead of treating every isolated word as evidence.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import NamedTuple


class Finding(NamedTuple):
    category: str
    code: str
    label: str
    line: int
    snippet: str
    severity: str = "should"


class PatternRule(NamedTuple):
    category: str
    code: str
    label: str
    pattern: str
    severity: str = "should"
    profiles: frozenset[str] = frozenset(
        {"article", "professional", "translation", "short-message", "marketing"}
    )


PROFILES = ("article", "professional", "translation", "short-message", "marketing")
SHAPE_PROFILES = {"article", "professional"}
FORMAT_PROFILES = {"article"}

PATTERN_RULES: tuple[PatternRule, ...] = (
    PatternRule(
        "template",
        "generic-transition",
        "generic transition or structure talk",
        (
            r"值得注意的是|在这个背景下|在此基础上|接上|"
            r"接下来(?:我们)?|"
            r"下面我们|换句话说|也就是说|综上(?:所述)?|"
            r"\bin conclusion\b|\bit is worth noting\b|"
            r"(?:^|[.!?]\s+)in this context\b|"
            r"\blet'?s look\b"
        ),
        "must",
    ),
    PatternRule(
        "template",
        "contrast-scaffold",
        "formulaic contrast scaffold",
        (
            r"不是.{0,50}而是|不只是|不仅(?:仅)?.{0,50}(?:而且|还)|"
            r"你以为.{0,50}其实|改变的不是|"
            r"\bnot only\b.{0,80}\bbut also\b|"
            r"\bon the one hand\b|\bon the other hand\b"
        ),
        "must",
    ),
    PatternRule(
        "posture",
        "vague-authority",
        "vague authority or unsupported importance",
        (
            r"至关重要|众所周知|显而易见|毋庸置疑|不可否认|"
            r"专家认为|行业报告显示|观察者指出|"
            r"\bneedless to say\b|\bundeniably\b|\bobviously\b"
        ),
        "must",
    ),
    PatternRule(
        "jargon",
        "corporate-jargon",
        "corporate or promotional jargon",
        (
            r"赋能|使能|加持|打通|拉通|抓手|闭环|降本增效|"
            r"\b(?:seamless|robust|leverage|unlock|empower|align)\b"
        ),
    ),
    PatternRule(
        "jargon",
        "generic-constraint-language",
        "generic constraint language; name the actual scope, responsibility, permission, control, or distinction",
        r"边界|\\bboundar(?:y|ies)\\b",
        profiles=frozenset({"professional", "article", "translation"}),
    ),
    PatternRule(
        "process-leak",
        "assistant-process-leak",
        "assistant or drafting process leaked into prose",
        (
            r"希望这对(?:您|你)有帮助|当然[！!]|请告诉我|"
            r"以上是.{0,20}(?:内容|建议)|"
            r"\bas an ai\b|\bplease let me know\b|"
            r"\bbased on (?:the )?available information\b"
        ),
        "must",
    ),
    PatternRule(
        "translationese",
        "untranslated-generic-term",
        "generic English term in Chinese prose",
        r"\b(?:context|state|cache|claim)\b",
        profiles=frozenset({"article", "translation", "marketing"}),
    ),
    PatternRule(
        "format",
        "summary-heading",
        "summary-style ending marker",
        r"^\s*#+\s*(?:总结|结论|综上|Conclusion|Summary)\b",
        profiles=frozenset({"article", "professional", "marketing"}),
    ),
)

CLUSTER_TERMS = (
    "其实",
    "真正",
    "越来越",
    "往往",
    "通常",
    "很多时候",
    "更重要的是",
    "更关键的是",
    "更容易",
    "很容易",
    "in fact",
    "ultimately",
    "notably",
)

SYNONYM_GROUPS = (
    ("变化", "改变", "转变", "变革"),
    ("窄", "局限", "有限", "狭窄"),
    ("系统", "平台", "工具", "解决方案"),
)


def _mask_range(chars: list[str], start: int, end: int) -> None:
    for index in range(start, end):
        if chars[index] != "\n":
            chars[index] = " "


def mask_protected_markdown(text: str) -> str:
    """Mask non-prose Markdown spans while preserving offsets and newlines."""
    chars = list(text)
    patterns: tuple[tuple[str, int], ...] = (
        (r"\A---[ \t]*\n.*?^---[ \t]*(?:\n|$)", re.MULTILINE | re.DOTALL),
        (
            r"(?ms)^[ \t]*(?:```|~~~).*?^[ \t]*(?:```|~~~)[ \t]*$",
            0,
        ),
        (r"(?m)^[ \t]*>.*$", 0),
        (r"!?\[[^\]\n]*\]\([^)]+\)", 0),
        (r"`+[^`\n]*`+", 0),
        (r"https?://[^\s)\]}>]+", 0),
        (r"“[^”\n]*”|‘[^’\n]*’|\"[^\"\n]*\"", 0),
        (r"<[^>\n]+>", 0),
    )
    for pattern, flags in patterns:
        for match in re.finditer(pattern, text, flags=flags):
            _mask_range(chars, match.start(), match.end())
    return "".join(chars)


def line_number(text: str, position: int) -> int:
    return text.count("\n", 0, position) + 1


def snippet_for_line(text: str, line: int, limit: int = 140) -> str:
    lines = text.splitlines()
    if not lines or line < 1 or line > len(lines):
        return ""
    snippet = lines[line - 1].strip()
    if len(snippet) > limit:
        return snippet[: limit - 3] + "..."
    return snippet


def phrase_findings(
    original: str,
    masked: str,
    profile: str,
) -> list[Finding]:
    findings: list[Finding] = []
    for rule in PATTERN_RULES:
        if profile not in rule.profiles:
            continue
        for match in re.finditer(
            rule.pattern,
            masked,
            flags=re.IGNORECASE | re.MULTILINE,
        ):
            line = line_number(masked, match.start())
            if (
                rule.code == "untranslated-generic-term"
                and not re.search(
                    r"[\u3400-\u9fff]",
                    snippet_for_line(masked, line),
                )
            ):
                continue
            findings.append(
                Finding(
                    rule.category,
                    rule.code,
                    rule.label,
                    line,
                    snippet_for_line(original, line),
                    rule.severity,
                )
            )
    return findings


def cluster_findings(original: str, masked: str) -> list[Finding]:
    findings: list[Finding] = []
    folded = masked.casefold()

    for term in CLUSTER_TERMS:
        positions = [
            match.start()
            for match in re.finditer(re.escape(term.casefold()), folded)
        ]
        for index in range(len(positions) - 2):
            cluster = positions[index : index + 3]
            if cluster[-1] - cluster[0] <= 260:
                line = line_number(masked, cluster[0])
                findings.append(
                    Finding(
                        "semantic-dilution",
                        "clustered-template-word",
                        f"template word repeated nearby: {term}",
                        line,
                        snippet_for_line(original, line),
                    )
                )
                break

    for group in SYNONYM_GROUPS:
        matches: list[tuple[int, str]] = []
        for term in group:
            matches.extend(
                (match.start(), term)
                for match in re.finditer(re.escape(term), masked)
            )
        matches.sort()
        for index in range(len(matches) - 3):
            window = matches[index : index + 4]
            if (
                window[-1][0] - window[0][0] <= 260
                and len({term for _, term in window}) >= 3
            ):
                line = line_number(masked, window[0][0])
                findings.append(
                    Finding(
                        "semantic-dilution",
                        "synonym-cycle",
                        "nearby synonyms may be cycling around one referent",
                        line,
                        snippet_for_line(original, line),
                        "review",
                    )
                )
                break
    return findings


def sentence_spans(text: str) -> list[tuple[int, str]]:
    spans: list[tuple[int, str]] = []
    start = 0
    for match in re.finditer(r"[。！？!?]+|(?<!\d)\.(?!\d)", text):
        sentence = text[start : match.end()].strip()
        if sentence:
            offset = start + len(text[start : match.end()]) - len(
                text[start : match.end()].lstrip()
            )
            spans.append((offset, sentence))
        start = match.end()
    tail = text[start:].strip()
    if tail:
        offset = start + len(text[start:]) - len(text[start:].lstrip())
        spans.append((offset, tail))
    return spans


def sentence_opening(sentence: str) -> str | None:
    cleaned = re.sub(r"^[\s#>*+\-\d.)（）、]+", "", sentence)
    cjk_match = re.match(r"([\u3400-\u9fff]{4})", cleaned)
    if cjk_match and len(cleaned) >= 8:
        return cjk_match.group(1)
    words = re.findall(r"[A-Za-z][A-Za-z'-]*", cleaned.casefold())
    if len(words) >= 5:
        return " ".join(words[:2])
    return None


def is_markdown_list_line(text: str, position: int) -> bool:
    start = text.rfind("\n", 0, position) + 1
    end = text.find("\n", position)
    if end == -1:
        end = len(text)
    return bool(re.match(r"\s*(?:[-*+]|\d+[.)])\s+", text[start:end]))


def _paragraph_spans(text: str) -> list[tuple[int, str]]:
    spans: list[tuple[int, str]] = []
    cursor = 0
    for block in re.split(r"\n[ \t]*\n", text):
        position = text.find(block, cursor)
        cursor = position + len(block)
        cleaned = block.strip()
        if cleaned:
            leading = len(block) - len(block.lstrip())
            spans.append((position + leading, cleaned))
    return spans


def structure_findings(
    original: str,
    masked: str,
    profile: str,
) -> list[Finding]:
    if profile not in SHAPE_PROFILES:
        return []

    findings: list[Finding] = []
    sentences = sentence_spans(masked)

    opening_positions: dict[str, list[int]] = defaultdict(list)
    for position, sentence in sentences:
        if is_markdown_list_line(masked, position):
            continue
        opening = sentence_opening(sentence)
        if opening:
            opening_positions[opening].append(position)
    for opening, positions in opening_positions.items():
        if len(positions) >= 3 and positions[2] - positions[0] <= 420:
            line = line_number(masked, positions[0])
            findings.append(
                Finding(
                    "rhythm",
                    "repeated-sentence-opening",
                    f"sentence opening repeated three times: {opening}",
                    line,
                    snippet_for_line(original, line),
                )
            )

    for paragraph_position, paragraph in _paragraph_spans(masked):
        for lead in ("能不能", "如何", "怎样", "can we", "how do we"):
            if len(re.findall(re.escape(lead), paragraph, re.IGNORECASE)) >= 3:
                line = line_number(masked, paragraph_position)
                findings.append(
                    Finding(
                        "rhythm",
                        "parallel-question-series",
                        f"three or more parallel questions begin with {lead}",
                        line,
                        snippet_for_line(original, line),
                    )
                )
                break

    if profile != "article":
        return findings

    paragraphs = _paragraph_spans(masked)
    single_sentence_runs: list[list[tuple[int, str]]] = []
    current_run: list[tuple[int, str]] = []
    for paragraph in paragraphs:
        position, body = paragraph
        if body.startswith(("#", "-", "*", "+")):
            is_single = False
        else:
            sentence_count = len(sentence_spans(body))
            is_single = sentence_count == 1 and len(body) <= 100
        if is_single:
            current_run.append(paragraph)
        else:
            if len(current_run) >= 3:
                single_sentence_runs.append(current_run)
            current_run = []
    if len(current_run) >= 3:
        single_sentence_runs.append(current_run)
    for run in single_sentence_runs:
        line = line_number(masked, run[0][0])
        findings.append(
            Finding(
                "rhythm",
                "stacked-single-sentence-paragraphs",
                "three or more consecutive single-sentence paragraphs",
                line,
                snippet_for_line(original, line),
            )
        )

    paragraph_lengths = [
        len(re.sub(r"\s+", "", body))
        for _, body in paragraphs
        if not body.startswith(("#", "-", "*", "+")) and len(body) >= 20
    ]
    if len(paragraph_lengths) >= 5:
        average = sum(paragraph_lengths) / len(paragraph_lengths)
        spread = max(paragraph_lengths) - min(paragraph_lengths)
        if average and spread / average <= 0.18:
            line = line_number(masked, paragraphs[0][0])
            findings.append(
                Finding(
                    "rhythm",
                    "uniform-paragraph-lengths",
                    "paragraph lengths are unusually uniform",
                    line,
                    snippet_for_line(original, line),
                    "review",
                )
            )

    return findings


def format_findings(
    original: str,
    masked: str,
    profile: str,
) -> list[Finding]:
    if profile not in FORMAT_PROFILES:
        return []
    matches = list(
        re.finditer(
            r"^\s*[-*+]\s+\*\*[^*\n]{1,50}\*\*[:：]?",
            masked,
            flags=re.MULTILINE,
        )
    )
    if len(matches) < 3:
        return []
    line = line_number(masked, matches[0].start())
    return [
        Finding(
            "format",
            "repeated-bold-label-bullets",
            "three or more bold-label bullets",
            line,
            snippet_for_line(original, line),
        )
    ]


def deduplicate_findings(findings: list[Finding]) -> list[Finding]:
    unique: dict[tuple[str, int], Finding] = {}
    for finding in findings:
        key = (finding.code, finding.line)
        unique.setdefault(key, finding)
    return sorted(
        unique.values(),
        key=lambda finding: (finding.line, finding.category, finding.code),
    )


def scan_text(
    text: str,
    source: Path = Path("<text>"),
    profile: str = "article",
) -> list[Finding]:
    del source  # Kept in the public API for callers that track source paths.
    if profile not in PROFILES:
        raise ValueError(
            f"unknown profile {profile!r}; choose from {', '.join(PROFILES)}"
        )
    masked = mask_protected_markdown(text)
    findings = phrase_findings(text, masked, profile)
    findings.extend(cluster_findings(text, masked))
    findings.extend(structure_findings(text, masked, profile))
    findings.extend(format_findings(text, masked, profile))
    return deduplicate_findings(findings)


def finding_as_dict(finding: Finding, source: Path) -> dict[str, object]:
    return {
        "source": str(source),
        "line": finding.line,
        "severity": finding.severity,
        "category": finding.category,
        "code": finding.code,
        "label": finding.label,
        "snippet": finding.snippet,
    }


def print_text_report(findings: list[Finding], source: Path) -> None:
    grouped: dict[str, list[Finding]] = defaultdict(list)
    for finding in findings:
        grouped[finding.category].append(finding)

    for category in sorted(grouped):
        print(f"[{category}]")
        for finding in grouped[category]:
            print(
                f"  {source}:{finding.line}: "
                f"{finding.severity} {finding.code} — {finding.label}"
            )
            if finding.snippet:
                print(f"    {finding.snippet}")
    counts = Counter(finding.severity for finding in findings)
    summary = ", ".join(f"{key}={value}" for key, value in sorted(counts.items()))
    print(f"\n{len(findings)} potential findings ({summary}).")


def scan(path: Path, profile: str, output_format: str) -> int:
    text = path.read_text(encoding="utf-8")
    findings = scan_text(text, source=path, profile=profile)
    if output_format == "json":
        print(
            json.dumps(
                [finding_as_dict(finding, path) for finding in findings],
                ensure_ascii=False,
                indent=2,
            )
        )
    elif findings:
        print_text_report(findings, path)

    if findings:
        return 1
    if output_format == "text":
        print(
            f"No obvious AI-taste fingerprints found in {path}. "
            "Read manually for argument shape, evidence, and voice."
        )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Diagnose common AI-writing fingerprints in Markdown or text."
    )
    parser.add_argument("path", type=Path, help="Markdown or text file to scan")
    parser.add_argument(
        "--profile",
        choices=PROFILES,
        default="article",
        help="Adjust structure and formatting checks for the text type",
    )
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        dest="output_format",
        help="Report format",
    )
    args = parser.parse_args()
    if not args.path.exists():
        parser.error(f"file not found: {args.path}")
    return scan(args.path, args.profile, args.output_format)


if __name__ == "__main__":
    raise SystemExit(main())
