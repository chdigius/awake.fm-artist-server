"""Subpage reference block."""
from dataclasses import dataclass
from typing import Optional, Literal, Dict, Any


@dataclass
class SubpageBlock:
  type: Literal["subpage"] = "subpage"
  ref: str = ""          # relative node path, e.g. "music/albums"
  label: Optional[str] = None
  title: Optional[str] = None  # Display title for link
  badge: Optional[str] = None  # Optional badge (e.g. "NEW", "50+ ITEMS")
  nav: bool = False      # opt into navbar dropdowns

  # Styling options
  align: Optional[Literal["left", "center", "right"]] = None
  size: Optional[Literal["small", "medium", "large", "xl"]] = None
  weight: Optional[Literal["normal", "bold", "light"]] = None
  decoration: Optional[Literal["none", "underline", "overline"]] = None
  transform: Optional[Literal["none", "uppercase", "lowercase", "capitalize"]] = None
  font: Optional[Literal["body", "heading", "mono"]] = None
  icon: Optional[Dict[str, Any]] = None  # { position: 'left'|'right'|'none', type: 'arrow'|'chevron'|'external'|'none' }

