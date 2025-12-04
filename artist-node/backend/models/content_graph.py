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

  @classmethod
  def from_dict(cls, data: Dict[str, Any]) -> "ContentNode":
    """
    Rehydrate a ContentNode from the JSON-like dict produced by to_dict().
    For now we’ll assume blocks were serialized with `asdict`, so we reconstruct
    them based on their `type` field.
    """
    meta_raw = data.get("meta") or {}
    meta = NodeMeta(
      path=data.get("path", meta_raw.get("path", "")),
      parent_path=None,  # can be recomputed by graph if needed
      layout=meta_raw.get("layout", ""),
      slug=meta_raw.get("slug"),
      display_name=meta_raw.get("display_name"),
      extra=meta_raw.get("extra") or {},
    )

    preview_raw = data.get("preview")
    preview = None
    if preview_raw:
      preview = NodePreview(
        title=preview_raw.get("title", ""),
        subtitle=preview_raw.get("subtitle"),
        image=preview_raw.get("image"),
        badge=preview_raw.get("badge"),
        blurb=preview_raw.get("blurb"),
      )

    blocks_raw = data.get("content") or []
    blocks: List[Block] = []
    for b in blocks_raw:
      btype = b.get("type")
      if btype == "hero":
        blocks.append(HeroBlock(
          heading=b.get("heading", ""),
          subheading=b.get("subheading"),
          body=b.get("body"),
          cta=b.get("cta"),
        ))
      elif btype == "section":
        # we can recurse into nested blocks later as needed
        blocks.append(SectionBlock(
          id=b.get("id"),
          label=b.get("label"),
          blocks=[],  # TODO: support nested blocks
        ))
      elif btype == "markdown":
        blocks.append(MarkdownBlock(
          body=b.get("body", ""),
        ))
      elif btype == "subpage":
        blocks.append(SubpageBlock(
          ref=b.get("ref", ""),
          label=b.get("label"),
          nav=b.get("nav", False),
        ))
      elif btype == "collection":
        blocks.append(CollectionBlock(
          source=b.get("source", "folder"),
          path=b.get("path"),
        ))
      # else: unknown type, ignore for now

    return cls(
      meta=meta,
      title=data.get("title"),
      tagline=data.get("tagline"),
      preview=preview,
      content=blocks,
    )
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

  @classmethod
  def from_dict(cls, data: Dict[str, Any]) -> "ContentGraph":
    graph = cls(root_content_path=data["root_content_path"])

    # restore nodes
    for path, node_data in data.get("nodes", {}).items():
      meta_data = node_data["meta"]
      meta = NodeMeta(
        path=meta_data["path"],
        parent_path=meta_data.get("parent_path"),
        layout=meta_data["layout"],
        slug=meta_data.get("slug"),
        display_name=meta_data.get("display_name"),
        extra=meta_data.get("extra", {}),
      )

      preview_data = node_data.get("preview")
      preview = None
      if preview_data:
        preview = NodePreview(
          title=preview_data["title"],
          subtitle=preview_data.get("subtitle"),
          image=preview_data.get("image"),
          badge=preview_data.get("badge"),
          blurb=preview_data.get("blurb"),
        )

      blocks_json = node_data.get("content", [])
      blocks: List[Block] = [cls._block_from_dict(b) for b in blocks_json]

      node = ContentNode(
        meta=meta,
        title=node_data.get("title"),
        tagline=node_data.get("tagline"),
        preview=preview,
        content=blocks,
      )
      graph.register_node(node)

    # if builder persisted children_by_parent, restore it
    if "children_by_parent" in data:
      graph.children_by_parent = data["children_by_parent"]

    # (artists / albums_by_artist / tracks_by_album we can restore later if needed)
    return graph

  @staticmethod
  def _block_from_dict(data: Dict[str, Any]) -> Block:
    btype = data.get("type")

    if btype == "hero":
      return HeroBlock(
        heading=data.get("heading", ""),
        subheading=data.get("subheading"),
        body=data.get("body"),
        cta=data.get("cta"),
      )

    if btype == "section":
      inner_blocks = [
        ContentGraph._block_from_dict(b) for b in data.get("blocks", []) or []
      ]
      return SectionBlock(
        id=data.get("id"),
        label=data.get("label"),
        blocks=inner_blocks,
      )

    if btype == "markdown":
      return MarkdownBlock(body=data.get("body", ""))

    if btype == "subpage":
      return SubpageBlock(
        ref=data.get("ref", ""),
        label=data.get("label"),
        nav=data.get("nav", False),
      )

    if btype == "collection":
      return CollectionBlock(
        source=data.get("source", "folder"),
        path=data.get("path"),
      )

    # fallback so we don't blow up on unknown blocks
    return MarkdownBlock(body=str(data))