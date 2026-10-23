from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "verify_preservation.py"
)
SPEC = importlib.util.spec_from_file_location("verify_preservation", SCRIPT_PATH)
assert SPEC and SPEC.loader
VERIFY_MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VERIFY_MODULE)


class AutomaticSpanTests(unittest.TestCase):
    def test_extracts_factual_and_markup_spans(self) -> None:
        text = (
            "报告日期为 2026-07-26，金额是 ¥12,300.50，增长 18.5%。"
            "版本为 2.0.1，内存是 64 GB。"
            "参见 [报告](https://example.com/report) 和 `customer_id`。"
            "原话是“先保留这个字段”。"
            "\n\n```python\nvalue = 42\n```"
        )

        spans = VERIFY_MODULE.extract_automatic_spans(text)

        self.assertIn("2026-07-26", spans)
        self.assertIn("¥12,300.50", spans)
        self.assertIn("18.5%", spans)
        self.assertIn("2.0.1", spans)
        self.assertIn("64", spans)
        self.assertIn("[报告](https://example.com/report)", spans)
        self.assertIn("`customer_id`", spans)
        self.assertIn("“先保留这个字段”", spans)
        self.assertIn("```python\nvalue = 42\n```", spans)

    def test_reports_removed_and_changed_spans(self) -> None:
        original = "Acme Corp 在 2026-07-26 支付 ¥12,300。"
        revised = "Acme 公司在 2026-07-27 支付 ¥12,000。"

        missing = VERIFY_MODULE.missing_spans(
            original,
            revised,
            explicit_spans=["Acme Corp"],
        )

        self.assertIn("Acme Corp", missing)
        self.assertIn("2026-07-26", missing)
        self.assertIn("¥12,300", missing)


if __name__ == "__main__":
    unittest.main()
