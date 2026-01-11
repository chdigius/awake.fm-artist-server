"""Subpage reference block."""
from dataclasses import dataclass
from typing import Optional, Literal


@dataclass
class SubpageBlock:
  type: Literal["subpage"] = "subpage"
  ref: str = ""          # relative node path, e.g. "music/albums"
  label: Optional[str] = None
  nav: bool = False      # opt into navbar dropdowns

