"""Section block for grouping content."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Literal, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
  from backend.models.blocks import Block


@dataclass
class SectionBlock:
  type: Literal["section"] = "section"
  id: Optional[str] = None
  label: Optional[str] = None
  blocks: List["Block"] = field(default_factory=list)
  align: Optional[Dict[str, Any]] = None  # { horizontal: "left"|"center"|"right", vertical: "start"|"center"|"end" }

