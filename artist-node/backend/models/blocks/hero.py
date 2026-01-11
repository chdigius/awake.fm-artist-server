"""Hero block and sigil configuration."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Literal, Any


@dataclass
class SigilConfig:
  """Configuration for a visual sigil (p5.js sketch or static image)."""
  type: Literal["p5", "image"] = "p5"
  id: Optional[str] = None           # for p5: registered sigil ID like "node-001"
  src: Optional[str] = None          # for image: path to static image
  alt: Optional[str] = None          # accessibility alt text
  options: Optional[Dict[str, Any]] = None  # p5 sigil options (seed, variant, etc.)


@dataclass
class HeroBlock:
  type: Literal["hero"] = "hero"
  heading: str = ""
  subheading: Optional[str] = None
  body: Optional[str] = None
  cta: Optional[Dict[str, str]] = None  # { "label": "...", "target": "#id" }
  sigil: Optional[SigilConfig] = None   # animated or static visual sigil
  background: Optional[str] = None      # background image path

