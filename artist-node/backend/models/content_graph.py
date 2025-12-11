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
  theme: Optional[str] = None  # "dark", "vapor", "crt", "minimal" - inherits from parent if None
  effects: List[str] = field(default_factory=list)  # ["crt", "chroma", "glow"] - visual FX layers
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
  "audio_player",
]

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


@dataclass
class VisualizerConfig:
  """Configuration for an audio visualizer."""
  type: Literal["p5"] = "p5"
  id: str = "spectrum-bars"  # registered sigil ID
  options: Optional[Dict[str, Any]] = None  # sensitivity, barCount, mirrorMode, etc.


@dataclass
class AudioPlayerBlock:
  """Audio player with optional visualizer."""
  type: Literal["audio_player"] = "audio_player"
  src: str = ""                              # path to audio file
  title: Optional[str] = None                # track title
  artist: Optional[str] = None               # artist name
  artwork: Optional[str] = None              # cover art path
  visualizer: Optional[VisualizerConfig] = None  # optional visualizer config


Block = Union[HeroBlock, SectionBlock, MarkdownBlock, SubpageBlock, CollectionBlock, AudioPlayerBlock]


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
        "theme": self.meta.theme,
        "effects": self.meta.effects,
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
      theme=meta_raw.get("theme"),
      effects=meta_raw.get("effects") or [],
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
        sigil_data = b.get("sigil")
        sigil = None
        if sigil_data:
          sigil = SigilConfig(
            type=sigil_data.get("type", "p5"),
            id=sigil_data.get("id"),
            src=sigil_data.get("src"),
            alt=sigil_data.get("alt"),
            options=sigil_data.get("options"),
          )
        blocks.append(HeroBlock(
          heading=b.get("heading", ""),
          subheading=b.get("subheading"),
          body=b.get("body"),
          cta=b.get("cta"),
          sigil=sigil,
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
      elif btype == "audio_player":
        visualizer_data = b.get("visualizer")
        visualizer = None
        if visualizer_data:
          visualizer = VisualizerConfig(
            type=visualizer_data.get("type", "p5"),
            id=visualizer_data.get("id", "spectrum-bars"),
            options=visualizer_data.get("options"),
          )
        blocks.append(AudioPlayerBlock(
          src=b.get("src", ""),
          title=b.get("title"),
          artist=b.get("artist"),
          artwork=b.get("artwork"),
          visualizer=visualizer,
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
  root_theme: Optional[str] = None      # default theme from content/_meta.yaml
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

    payload = node.to_dict()

    # Compute effective_theme by walking up the tree
    effective_theme = self._resolve_theme(path)
    payload["meta"]["effective_theme"] = effective_theme

    return payload

  def _resolve_theme(self, path: str) -> Optional[str]:
    """
    Walk up the node tree to find the nearest theme.
    Falls back to root_theme if no ancestor has a theme set.
    
    Handles missing intermediate nodes by computing parent from path string.
    e.g. server/pages/releases -> server/pages -> server (even if server/pages doesn't exist)
    """
    current_path: Optional[str] = path

    while current_path:
      node = self.get_node(current_path)
      
      # If node exists and has a theme, use it
      if node and node.meta.theme:
        return node.meta.theme

      # Move to parent - prefer node's parent_path, but fall back to computing from path
      if node and node.meta.parent_path:
        current_path = node.meta.parent_path
      elif "/" in current_path:
        # Node doesn't exist or has no parent_path - compute parent from path string
        current_path = "/".join(current_path.split("/")[:-1])
      else:
        # We're at a root-level path with no parent
        break

    # No theme found in ancestors, use root theme
    return self.root_theme

  @classmethod
  def from_dict(cls, data: Dict[str, Any]) -> "ContentGraph":
    graph = cls(
      root_content_path=data["root_content_path"],
      root_theme=data.get("root_theme"),
    )

    # restore nodes
    for path, node_data in data.get("nodes", {}).items():
      meta_data = node_data["meta"]
      meta = NodeMeta(
        path=meta_data["path"],
        parent_path=meta_data.get("parent_path"),
        layout=meta_data["layout"],
        slug=meta_data.get("slug"),
        display_name=meta_data.get("display_name"),
        theme=meta_data.get("theme"),
        effects=meta_data.get("effects") or [],
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
      sigil_data = data.get("sigil")
      sigil = None
      if sigil_data:
        sigil = SigilConfig(
          type=sigil_data.get("type", "p5"),
          id=sigil_data.get("id"),
          src=sigil_data.get("src"),
          alt=sigil_data.get("alt"),
          options=sigil_data.get("options"),
        )
      return HeroBlock(
        heading=data.get("heading", ""),
        subheading=data.get("subheading"),
        body=data.get("body"),
        cta=data.get("cta"),
        sigil=sigil,
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

    if btype == "audio_player":
      visualizer_data = data.get("visualizer")
      visualizer = None
      if visualizer_data:
        visualizer = VisualizerConfig(
          type=visualizer_data.get("type", "p5"),
          id=visualizer_data.get("id", "spectrum-bars"),
          options=visualizer_data.get("options"),
        )
      return AudioPlayerBlock(
        src=data.get("src", ""),
        title=data.get("title"),
        artist=data.get("artist"),
        artwork=data.get("artwork"),
        visualizer=visualizer,
      )

    # fallback so we don't blow up on unknown blocks
    return MarkdownBlock(body=str(data))