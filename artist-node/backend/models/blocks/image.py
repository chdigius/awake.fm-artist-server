"""Image configuration for static and generative images."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Literal, Any


@dataclass
class ImageConfig:
  """Configuration for static or generative images.
  
  Can be used for thumbnails, banners, backgrounds, or any image asset.
  """
  type: Literal["static", "generative_from_seed"] = "static"
  
  # Static image fields
  src: Optional[str] = None  # Path to static image file
  alt: Optional[str] = None  # Accessibility alt text
  
  # Generative image fields
  seedFrom: Optional[Literal["filename", "item_name", "artist_name", "page", "collection_position"]] = None
  seed: Optional[int] = None  # Explicit seed override
  style: Optional[Dict[str, Any]] = None  # RadiantForge style options (pattern, colors, etc.)
