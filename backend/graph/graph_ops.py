# backend/graph/graph_ops.py

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional

from backend.models.content_graph import ContentGraph, ContentNode, SubpageBlock


@dataclass
class GraphOps:
  graph: ContentGraph
  nav_config: Dict[str, Any] = field(default_factory=dict)

  @classmethod
  def from_graph(
    cls,
    graph: ContentGraph,
    nav_config: Optional[Dict[str, Any]] = None,
  ) -> "GraphOps":
    self = cls(graph=graph, nav_config=nav_config or {})
    # TODO: build artists/albums/tracks indexes later
    return self

  # --- nav: helpers ---

  def _resolve_ref(self, ref: str) -> Optional[str]:
    """
    Map a nav.yaml 'ref' to a graph node path.

    Rules for now:
      "."           -> graph.root_content_path (e.g. "server")
      "../artists"  -> "artists"  (we treat it as relative to root's parent)
      "pages/foo"   -> "pages/foo"
    """
    if not ref:
      return None

    if ref == ".":
      return self.graph.root_content_path

    if ref.startswith("../"):
      # Relative to parent of root_content_path. Since our root is logically "server",
      # "../artists" just becomes "artists".
      return ref[3:] or None

    return ref

  def _href_for_path(self, path: str) -> str:
    """
    Convert a node path into a URL.
      - root_content_path -> "/"
      - otherwise: "/" + path
    """
    if path == self.graph.root_content_path:
      return "/"
    return "/" + path

  def _nav_item_from_entry(self, entry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    ref = entry.get("ref")
    label = entry.get("label")

    path = self._resolve_ref(ref) if ref is not None else None
    if not path:
      return None

    node = self.graph.get_node(path)
    if not node:
      return None

    effective_label = (
      label
      or node.meta.display_name
      or node.title
      or node.meta.slug
      or node.meta.path
    )

    href = self._href_for_path(node.meta.path)

    # For now, ignore auto_children beyond an empty list.
    # We'll add a separate test and implementation that looks up subpages later.
    children: List[Dict[str, Any]] = []

    if entry.get("auto_children") == "from_subpages":
      for block in node.content:
        if isinstance(block, SubpageBlock) and block.nav:
          child_node = self.graph.get_node(block.ref)
          if not child_node:
            continue
          child_label = block.label or child_node.meta.display_name or child_node.title or child_node.meta.slug or child_node.meta.path
          child_href = self._href_for_path(child_node.meta.path)
          children.append({
            "label": child_label,
            "href": child_href,
            "children": [],
          })

    return {
      "label": effective_label,
      "href": href,
      "children": children,
    }

  def get_nav(self) -> Dict[str, Any]:
    items: List[Dict[str, Any]] = []
    for entry in self.nav_config.get("items", []):
      item = self._nav_item_from_entry(entry)
      if item:
        items.append(item)
    return {"items": items}
