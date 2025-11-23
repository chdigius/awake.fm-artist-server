# models.py
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Dict, List, Optional, Literal, Union, Any


# ---------- Basic node metadata ----------

@dataclass
class NodeMeta:
  path: str                # "server", "artists/zol", "server/pages/store", etc.
  parent_path: Optional[str]  # None for root nodes like "server"
  layout: str              # "server", "artist", "album", "track", ...
  slug: Optional[str] = None
  display_name: Optional[str] = None
  extra: Dict[str, Any] = field(default_factory=dict)
  # extra can hold things like imprints, roster, status, etc.


@dataclass
class NodePreview:
  title: str
  subtitle: Optional[str] = None
  image: Optional[str] = None
  badge: Optional[str] = None   # e.g. "Artist", "Album", "Set"
  blurb: Optional[str] = None   # short card/body text


# ---------- Content block types ----------

BlockType = Literal[
  "hero",
  "section",
  "markdown",
  "subpage",
  "collection",
]

@dataclass
class HeroBlock:
  type: Literal["hero"] = "hero"
  heading: str = ""
  subheading: Optional[str] = None
  body: Optional[str] = None
  cta: Optional[Dict[str, str]] = None  # { "label": "...", "target": "#id" }


@dataclass
class SectionBlock:
  type: Literal["section"] = "section"
  id: Optional[str] = None
  label: Optional[str] = None
  blocks: List["Block"] = field(default_factory=list)


@dataclass
class MarkdownBlock:
  type: Literal["markdown"] = "markdown"
  body: str = ""


@dataclass
class SubpageBlock:
  type: Literal["subpage"] = "subpage"
  ref: str = ""          # relative node path, e.g. "music/albums"
  label: Optional[str] = None
  nav: bool = False      # opt into navbar dropdowns


@dataclass
class CollectionBlock:
  type: Literal["collection"] = "collection"
  source: str = "folder"  # "folder", "roster", "tag", etc.
  path: Optional[str] = None  # when source == "folder", like "../artists"


Block = Union[HeroBlock, SectionBlock, MarkdownBlock, SubpageBlock, CollectionBlock]


# ---------- Core content node ----------

@dataclass
class ContentNode:
  meta: NodeMeta
  title: Optional[str] = None
  tagline: Optional[str] = None
  preview: Optional[NodePreview] = None
  content: List[Block] = field(default_factory=list)

  def to_dict(self) -> Dict[str, Any]:
    """Serialize to a JSON-friendly dict for the frontend."""
    return {
      "path": self.meta.path,
      "meta": {
        "layout": self.meta.layout,
        "slug": self.meta.slug,
        "display_name": self.meta.display_name,
        "extra": self.meta.extra,
      },
      "title": self.title,
      "tagline": self.tagline,
      "preview": asdict(self.preview) if self.preview else None,
      "content": [asdict(block) for block in self.content],
    }


# ---------- The full graph + indexes ----------

@dataclass
class ContentGraph:
  root_content_path: str                # e.g. "server" or "artists/zol"
  nodes: Dict[str, ContentNode] = field(default_factory=dict)

  # Derived indexes for fast traversal:
  children_by_parent: Dict[str, List[str]] = field(default_factory=dict)
  artists: List[str] = field(default_factory=list)   # list of node paths for artist roots
  albums_by_artist: Dict[str, List[str]] = field(default_factory=dict)  # artist_id -> [album node paths]
  tracks_by_album: Dict[str, List[str]] = field(default_factory=dict)   # album node path -> [track node paths]

  def get_node(self, path: str) -> Optional[ContentNode]:
    return self.nodes.get(path)

  def register_node(self, node: ContentNode) -> None:
    """Add a node and update basic indexes."""
    path = node.meta.path
    self.nodes[path] = node

    parent = node.meta.parent_path
    if parent:
      self.children_by_parent.setdefault(parent, []).append(path)

  def to_page_payload(self, path: str) -> Optional[Dict[str, Any]]:
    """Shape a node into the JSON your frontend /api/page endpoint can return."""
    node = self.get_node(path)
    if not node:
      return None

    return node.to_dict()
