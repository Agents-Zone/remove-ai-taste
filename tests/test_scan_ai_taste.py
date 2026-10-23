from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "scan_ai_taste.py"
)
SPEC = importlib.util.spec_from_file_location("scan_ai_taste", SCRIPT_PATH)
assert SPEC and SPEC.loader
SCAN_MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SCAN_MODULE)


def finding_codes(text: str, profile: str = "article") -> list[str]:
    findings = SCAN_MODULE.scan_text(
        text,
        source=Path("sample.md"),
        profile=profile,
    )
    return [finding.code for finding in findings]


class ProtectedSpanTests(unittest.TestCase):
    def test_ignores_markdown_metadata_code_links_quotes_and_html(self) -> None:
        text = """---
description: "not only a test but also an example"
---

`其实`只是代码里的字符串。

```python
claim = "不是事实，而是测试"
```

[align documentation](https://example.com/align)

> “这不是作者的判断，而是受访者原话。”

<div align="center">标题</div>
"""

        self.assertEqual(finding_codes(text), [])

    def test_scans_prose_around_protected_spans(self) -> None:
        text = "值得注意的是，`claim` 的值没有变化。"

        self.assertIn("generic-transition", finding_codes(text))


class MarketingProfileTests(unittest.TestCase):
    def test_marketing_profile_reports_phrase_findings(self) -> None:
        codes = finding_codes("值得注意的是，这套方法能赋能销售团队。", profile="marketing")
        self.assertIn("generic-transition", codes)
        self.assertIn("corporate-jargon", codes)

    def test_marketing_profile_skips_shape_and_format_checks(self) -> None:
        self.assertNotIn("marketing", SCAN_MODULE.SHAPE_PROFILES)
        self.assertNotIn("marketing", SCAN_MODULE.FORMAT_PROFILES)
        text = "报名截止本周五。\n\n名额 30 个。\n\n扫码进群。\n\n现场答疑。\n"
        self.assertEqual(finding_codes(text, profile="marketing"), [])


class FrequencyTests(unittest.TestCase):
    def test_single_contextual_word_is_not_a_finding(self) -> None:
        self.assertNotIn(
            "clustered-template-word",
            finding_codes("这个结果其实与上周一致。"),
        )

    def test_nearby_repetition_is_reported_as_a_cluster(self) -> None:
        text = (
            "这个结果其实与上周一致。其实团队早已发现问题。"
            "继续检查后，其实日志也给出了同样的结论。"
        )

        self.assertIn("clustered-template-word", finding_codes(text))


class StructureTests(unittest.TestCase):
    def test_detects_parallel_question_series(self) -> None:
        text = "能不能下载？能不能运行？能不能少填几张表？"

        self.assertIn("parallel-question-series", finding_codes(text))

    def test_detects_repeated_sentence_openings(self) -> None:
        text = (
            "我们需要检查输入。"
            "我们需要检查输出。"
            "我们需要检查日志。"
        )

        self.assertIn("repeated-sentence-opening", finding_codes(text))

    def test_detects_consecutive_single_sentence_paragraphs(self) -> None:
        text = (
            "第一步很简单。\n\n"
            "第二步也很简单。\n\n"
            "第三步仍然很简单。"
        )

        self.assertIn("stacked-single-sentence-paragraphs", finding_codes(text))

    def test_short_message_profile_skips_article_shape_warning(self) -> None:
        text = "收到。\n\n我来查。\n\n稍后回复。"

        self.assertNotIn(
            "stacked-single-sentence-paragraphs",
            finding_codes(text, profile="short-message"),
        )

    def test_professional_profile_preserves_functional_short_blocks(self) -> None:
        text = "作者：张三\n\n版本：二\n\n许可证：MIT"

        self.assertNotIn(
            "stacked-single-sentence-paragraphs",
            finding_codes(text, profile="professional"),
        )

    def test_professional_profile_preserves_parallel_instructions(self) -> None:
        text = (
            "- Do not add any new facts.\n"
            "- Do not alter any official names.\n"
            "- Do not copy any source quotations."
        )

        self.assertNotIn(
            "repeated-sentence-opening",
            finding_codes(text, profile="professional"),
        )

    def test_professional_profile_preserves_ordered_instructions(self) -> None:
        text = (
            "1. Do not add any new facts.\n"
            "2. Do not alter any official names.\n"
            "3. Do not copy any source quotations."
        )

        self.assertNotIn(
            "repeated-sentence-opening",
            finding_codes(text, profile="professional"),
        )


class FormatAndLanguageTests(unittest.TestCase):
    def test_flags_generic_constraint_language_for_review(self) -> None:
        self.assertIn(
            "generic-constraint-language",
            finding_codes("需要明确质量边界与责任边界。", profile="professional"),
        )

    def test_skips_generic_constraint_language_in_short_messages(self) -> None:
        self.assertNotIn(
            "generic-constraint-language",
            finding_codes("请确认权限边界。", profile="short-message"),
        )

    def test_article_profile_detects_repeated_bold_label_bullets(self) -> None:
        text = (
            "- **背景：** 介绍背景。\n"
            "- **问题：** 介绍问题。\n"
            "- **结论：** 介绍结论。\n"
        )

        self.assertIn("repeated-bold-label-bullets", finding_codes(text))

    def test_detects_english_formulaic_conclusion(self) -> None:
        text = "In conclusion, this solution is robust and seamless."

        codes = finding_codes(text)
        self.assertIn("generic-transition", codes)
        self.assertIn("corporate-jargon", codes)

    def test_does_not_treat_english_technical_terms_as_translationese(self) -> None:
        text = "The cache stores state for the current request context."

        self.assertNotIn("untranslated-generic-term", finding_codes(text))

    def test_context_as_a_normal_object_is_not_a_transition(self) -> None:
        text = "Would a real person say this sentence in this context?"

        self.assertNotIn("generic-transition", finding_codes(text))


if __name__ == "__main__":
    unittest.main()
