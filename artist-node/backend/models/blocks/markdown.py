"""Markdown content block."""
from dataclasses import dataclass
from typing import Literal


@dataclass
class MarkdownBlock:
  type: Literal["markdown"] = "markdown"
  body: str = ""

