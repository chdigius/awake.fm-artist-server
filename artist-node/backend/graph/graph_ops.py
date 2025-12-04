# backend/graph/graph_ops.py

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Iterable, Union, Set

from backend.models.content_graph import (
  ContentGraph,
  ContentNode,
  SubpageBlock,
  SectionBlock,
)


BlockLike = Union[SubpageBlock, SectionBlock, Dict[str, Any]]


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
    return cls(graph=graph, nav_config=nav_config or {})

  # ------------- helpers -------------

  def _resolve_ref(self, ref: str) -> Optional[str]:
    root = self.graph.root_content_path

    if ref in (".", "./"):
      path = root
    else:
      path = ref

    if self.graph.get_node(path) is None:
      print(f"DEBUG _resolve_ref: ref='{ref}' -> path='{path}' (NOT FOUND)")
      return None

    print(f"DEBUG _resolve_ref: ref='{ref}' -> path='{path}'")
    return path

  def _href_for_path(self, path: str) -> str:
    if path == self.graph.root_content_path:
      return "/"
    return "/" + path

  def _iter_nav_subpages(self, blocks: Iterable[BlockLike]) -> Iterable[BlockLike]:
    for block in blocks:
      btype = getattr(block, "type", None)
      if btype is None and isinstance(block, dict):
        btype = block.get("type")

      if btype == "subpage":
        nav_flag = getattr(block, "nav", None)
        if nav_flag is None and isinstance(block, dict):
          nav_flag = block.get("nav", False)

        if nav_flag:
          yield block

      elif btype == "section":
        if isinstance(block, SectionBlock):
          inner = block.blocks
        elif isinstance(block, dict):
          inner = block.get("blocks", []) or []
        else:
          inner = []

        if inner:
          yield from self._iter_nav_subpages(inner)

  # 🔥 NEW: build nested nav tree for a given node
  def _build_nav_tree_for_node(
    self,
    node: ContentNode,
    visited: Optional[Set[str]] = None,
  ) -> List[Dict[str, Any]]:
    if visited is None:
      visited = set()

    if node.meta.path in visited:
      return []
    visited.add(node.meta.path)

    children: List[Dict[str, Any]] = []

    for block in self._iter_nav_subpages(node.content):
      # dataclass vs dict support
      if isinstance(block, SubpageBlock):
        ref_path = block.ref
        label = block.label
      else:  # dict
        ref_path = block.get("ref")
        label = block.get("label")

      if not ref_path:
        continue

      target = self.graph.get_node(ref_path)
      if not target:
        continue

      effective_label = (
        label
        or target.meta.display_name
        or target.title
        or target.meta.slug
        or target.meta.path
      )

      child = {
        "label": effective_label,
        "href": self._href_for_path(target.meta.path),
        # recursion: allow 3rd, 4th, ... levels
        "children": self._build_nav_tree_for_node(target, visited),
      }
      children.append(child)

    return children

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

    if entry.get("auto_children") == "from_subpages":
      children = self._build_nav_tree_for_node(node)
    else:
      children: List[Dict[str, Any]] = []

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

  def get_page(self, path: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Return a page payload for the given node path.

    - If path is None or empty, use graph.root_content_path.
    - If the node does not exist, return None.
    """
    if not path:
      path = self.graph.root_content_path

    return self.graph.to_page_payload(path)