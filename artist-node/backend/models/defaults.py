"""Default configurations for content blocks."""
from typing import Dict, Any


def _deep_merge(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
  """Merge dict b into dict a recursively, returning a new dict."""
  out = dict(a or {})
  for k, v in (b or {}).items():
    if isinstance(v, dict) and isinstance(out.get(k), dict):
      out[k] = _deep_merge(out[k], v)
    else:
      out[k] = v
  return out


DEFAULT_COLLECTION_LAYOUTS: Dict[str, Dict[str, Any]] = {
  "grid": {
    "mode": "grid",
    "columns": {"xl": 5, "lg": 4, "md": 3, "sm": 2, "xs": 1},
    "gap": {"row": "1.5rem", "column": "1.5rem"},
    "align": {"horizontal": "stretch", "vertical": "start"},
  },
  "list": {
    "mode": "list",
    "dense": False,
    "show_dividers": True,
    "show_avatar": True,
    "show_meta": True,
    "align": {"vertical": "center"},
  },
  "carousel": {
    "mode": "carousel",
    "slides_per_view": {"xl": 5, "lg": 4, "md": 3, "sm": 2, "xs": 1},
    "spacing": "1rem",
    "loop": True,
    "autoplay": {"enabled": True, "interval_ms": 8000, "pause_on_hover": True},
    "controls": {"arrows": True, "dots": True},
    "snap_align": "center",
    "max_width": "100%",
  },
}


__all__ = ["DEFAULT_COLLECTION_LAYOUTS", "_deep_merge"]

