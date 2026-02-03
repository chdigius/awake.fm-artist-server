"""Content graph - the core CMS data structure for the artist node."""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any

# Import all block types and node classes from refactored modules
from backend.models.blocks import (
  Block,
  BlockType,
  HeroBlock,
  SectionBlock,
  MarkdownBlock,
  SubpageBlock,
  CollectionBlock,
  AudioPlayerBlock,
  SigilConfig,
  CollectionLayout,
  CollectionPaging,
  CollectionMedia,
  CollectionThumbnail,
  VisualizerConfig,
)
from backend.models.node import NodeMeta, NodePreview, ContentNode


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

  def __post_init__(self):
    """Initialize the collection resolver after dataclass init."""
    from backend.models.collection_resolver import CollectionResolver
    self._collection_resolver = CollectionResolver(self)

  def get_collection_payload(
    self,
    *,
    source: str,
    path: str,
    page: int = 1,
    page_size: int = 24,
    sort: Optional[str] = None,
    limit: Optional[int] = None,
    layout: Optional[Dict[str, Any]] = None,
    card: Optional[str] = None,
    pattern: Optional[str] = None,
    thumbnail: Optional[Dict[str, Any]] = None,
    current_node_path: str = "server",
  ) -> Dict[str, Any]:
    """
    Resolve + paginate a collection and return a frontend-friendly payload.
    
    Delegates to CollectionResolver for all resolution logic.
    """
    return self._collection_resolver.resolve_collection(
      source=source,
      path=path,
      pattern=pattern,
      page=page,
      page_size=page_size,
      sort=sort,
      limit=limit,
      layout=layout,
      card=card,
      thumbnail=thumbnail,
      current_node_path=current_node_path,
    )

  def _hydrate_block(self, block: Block, current_node_path: str) -> Dict[str, Any]:
    """Recursively hydrate blocks for page payload output."""
    if isinstance(block, SectionBlock):
      data = asdict(block)
      inner = []
      for child in block.blocks or []:
        inner.append(self._hydrate_block(child, current_node_path=current_node_path))
      data["blocks"] = inner
      return data

    if isinstance(block, CollectionBlock):
      return self._collection_resolver.hydrate_collection_block(block, current_node_path)

    # default: plain asdict
    return asdict(block)

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

    # Hydrate collections (and recurse through sections)
    hydrated_blocks: List[Dict[str, Any]] = []
    for block in node.content:
      hydrated_blocks.append(self._hydrate_block(block, current_node_path=path))
    payload["content"] = hydrated_blocks

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
        collection_order=meta_data.get("collection_order"),
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
        background=node_data.get("background"),
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
        background=data.get("background"),
      )

    if btype == "section":
      inner_blocks = [
        ContentGraph._block_from_dict(b) for b in data.get("blocks", []) or []
      ]
      return SectionBlock(
        id=data.get("id"),
        label=data.get("label"),
        blocks=inner_blocks,
        align=data.get("align"),
      )

    if btype == "markdown":
      return MarkdownBlock(body=data.get("body", ""))

    if btype == "subpage":
      return SubpageBlock(
        ref=data.get("ref", ""),
        label=data.get("label"),
        title=data.get("title"),
        badge=data.get("badge"),
        nav=data.get("nav", False),
        align=data.get("align"),
        size=data.get("size"),
        weight=data.get("weight"),
        decoration=data.get("decoration"),
        transform=data.get("transform"),
        font=data.get("font"),
        icon=data.get("icon"),
      )

    if btype == "collection":
      layout_data = data.get("layout") or None
      paging_data = data.get("paging") or None
      media_data = data.get("media") or None

      layout = None
      if layout_data:
        layout = CollectionLayout(
          mode=layout_data.get("mode", "grid"),
          columns=layout_data.get("columns"),
          gap=layout_data.get("gap"),
          align=layout_data.get("align"),
          max_rows=layout_data.get("max_rows"),
          pagination=layout_data.get("pagination"),
          dense=layout_data.get("dense"),
          show_dividers=layout_data.get("show_dividers"),
          show_avatar=layout_data.get("show_avatar"),
          show_meta=layout_data.get("show_meta"),
          max_items=layout_data.get("max_items"),
          slides_per_view=layout_data.get("slides_per_view"),
          spacing=layout_data.get("spacing"),
          loop=layout_data.get("loop"),
          autoplay=layout_data.get("autoplay"),
          controls=layout_data.get("controls"),
          snap_align=layout_data.get("snap_align"),
          max_width=layout_data.get("max_width"),
        )

      paging = None
      if paging_data:
        paging = CollectionPaging(
          enabled=paging_data.get("enabled", False),
          page_size=paging_data.get("page_size"),
          mode=paging_data.get("mode", "load_more"),
        )

      media = None
      if media_data:
        media = CollectionMedia(
          type=media_data.get("type", "audio"),
          player=media_data.get("player"),
          visualizer=media_data.get("visualizer"),
        )

      # Parse thumbnail config if present
      thumbnail_data = data.get("thumbnail")
      thumbnail = None
      if thumbnail_data:
        thumbnail = CollectionThumbnail(
          type=thumbnail_data.get("type", "generative_from_seed"),
          seedImage=thumbnail_data.get("seedImage"),
          style=thumbnail_data.get("style"),
          seedFrom=thumbnail_data.get("seedFrom"),
        )

      return CollectionBlock(
        source=data.get("source", "folder"),
        path=data.get("path"),
        pattern=data.get("pattern"),
        layout=layout,
        card=data.get("card"),
        media=media,
        thumbnail=thumbnail,
        sort=data.get("sort"),
        sort_options=data.get("sort_options"),
        limit=data.get("limit"),
        filters=data.get("filters"),
        paging=paging,
        empty_state=data.get("empty_state"),
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
