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
  background: Optional[str] = None      # background image path


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


# @dataclass
# class CollectionBlock:
#   type: Literal["collection"] = "collection"
#   source: str = "folder"  # "folder", "roster", "tag", etc.
#   path: Optional[str] = None  # when source == "folder", like "../artists"

CollectionLayoutMode = Literal["grid", "list", "carousel"]
CollectionPagingMode = Literal["load_more", "pages"]

@dataclass
class CollectionLayout:
  """
  Layout configuration for collection blocks.

  Not all fields are used for every mode, but that's fine:
  - mode == "grid":      columns, gap, align, max_rows, pagination
  - mode == "list":      dense, show_dividers, show_avatar, show_meta, max_items
  - mode == "carousel":  slides_per_view, spacing, loop, autoplay, controls, snap_align, max_width
  """
  mode: CollectionLayoutMode = "grid"

  # --- Grid-specific knobs ---
  columns: Optional[Dict[str, int]] = None  # { "xl": 5, "lg": 4, ... }
  gap: Optional[Dict[str, str]] = None      # { "row": "1.5rem", "column": "1.5rem" }
  align: Optional[Dict[str, str]] = None    # { "horizontal": "stretch", "vertical": "start" }
  max_rows: Optional[int] = None            # optional: before "View All" / pagination
  pagination: Optional[Dict[str, Any]] = None  # { "enabled": False, ... }

  # --- List-specific knobs ---
  dense: Optional[bool] = None             # tighter vertical spacing
  show_dividers: Optional[bool] = None
  show_avatar: Optional[bool] = None
  show_meta: Optional[bool] = None
  max_items: Optional[int] = None          # before "View All" link

  # --- Carousel-specific knobs ---
  slides_per_view: Optional[Dict[str, int]] = None  # { "xl": 5, "lg": 4, ... }
  spacing: Optional[str] = None                     # gap between slides
  loop: Optional[bool] = None
  autoplay: Optional[Dict[str, Any]] = None         # { "enabled": True, "interval_ms": 8000, ... }
  controls: Optional[Dict[str, Any]] = None         # { "arrows": True, "dots": True }
  snap_align: Optional[str] = None                  # "start" | "center"
  max_width: Optional[str] = None                   # e.g. "100%", "1200px"

@dataclass
class CollectionPaging:
  """
  Paging configuration for a collection block.

  Backend will use this to decide how many items to include in the initial payload,
  and can return paging metadata (page, total_pages, has_more, etc.).
  """
  enabled: bool = False
  page_size: Optional[int] = None                 # items per page (if None, treat as "all")
  mode: CollectionPagingMode = "load_more"        # "load_more" | "pages"

@dataclass
class CollectionBlock:
  type: Literal["collection"] = "collection"

  # where the items come from
  source: Literal["folder", "roster", "tag", "query"] = "folder"
  path: Optional[str] = None          # when source == "folder", e.g. "artists"

  # presentation + behavior
  layout: Optional[CollectionLayout] = None
  card: Optional[str] = None          # which card component/template to use, e.g. "artist"

  # data shaping
  sort: Optional[str] = None          # "name_asc", "random", etc.
  sort_options: Optional[List[Dict[str, str]]] = None  # [{ "key": "name_asc", "label": "Name (A–Z)" }]
  limit: Optional[int] = None         # hard cap from backend
  filters: Optional[Dict[str, Any]] = None  # future: genre filters, tags, etc.

  # paging
  paging: Optional[CollectionPaging] = None   # { enabled, page_size, mode }

  # UX when empty
  empty_state: Optional[Dict[str, str]] = None  # { "heading": "...", "body": "..." }


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
  background: Optional[str] = None      # page-level background image path
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
      "background": self.background,
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
          background=b.get("background"),
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
        # Parse layout config if present
        layout_data = b.get("layout")
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
        
        # Parse paging config if present
        paging_data = b.get("paging")
        paging = None
        if paging_data:
          paging = CollectionPaging(
            enabled=paging_data.get("enabled", False),
            page_size=paging_data.get("page_size"),
            mode=paging_data.get("mode", "load_more"),
          )
        
        blocks.append(CollectionBlock(
          source=b.get("source", "folder"),
          path=b.get("path"),
          layout=layout,
          card=b.get("card"),
          sort=b.get("sort"),
          sort_options=b.get("sort_options"),
          limit=b.get("limit"),
          filters=b.get("filters"),
          paging=paging,
          empty_state=b.get("empty_state"),
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
      background=data.get("background"),
      preview=preview,
      content=blocks,
    )
# ---------- The full graph + indexes ----------

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
    current_node_path: str = "server",
  ) -> Dict[str, Any]:
    """
    Resolve + paginate a collection and return a frontend-friendly payload.
    Mirrors the structure we embed in /api/page hydration.

    NOTE: `current_node_path` is here for future relative-path resolution rules.
    """
    # Normalize
    page = max(1, int(page or 1))
    page_size = max(1, int(page_size or 24))

    # Build a temporary CollectionBlock (so we can reuse logic cleanly)
    temp_block = CollectionBlock(
      source=source or "folder",
      path=path,
      sort=sort,
      limit=limit,
      card=card,
      layout=CollectionLayout(mode=(layout or {}).get("mode", "grid")) if layout else None,
      paging=CollectionPaging(enabled=True, page_size=page_size, mode="load_more"),
    )

    # Merge layout defaults (same approach as page hydration)
    layout_dict = layout or {}
    mode = (layout_dict.get("mode") or "grid")
    defaults = DEFAULT_COLLECTION_LAYOUTS.get(mode, DEFAULT_COLLECTION_LAYOUTS["grid"])
    merged_layout = _deep_merge(defaults, layout_dict)

    # Resolve candidates
    candidates = self._resolve_collection_candidates(temp_block, current_node_path=current_node_path)

    # Sort + limit
    candidates = self._apply_collection_sort(candidates, sort=sort)

    if isinstance(limit, int) and limit > 0:
      candidates = candidates[:limit]

    total_items = len(candidates)
    total_pages = (total_items + page_size - 1) // page_size if page_size else 1

    # Slice
    start = (page - 1) * page_size
    end = start + page_size
    page_paths = candidates[start:end]

    items = [self._collection_item_payload(p) for p in page_paths]

    return {
      "type": "collection",
      "source": source or "folder",
      "path": path,
      "card": card,
      "sort": sort,
      "layout": merged_layout,
      "items": items,
      "paging": {
        "enabled": True,
        "mode": "load_more",
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
        "has_more": end < total_items,
      },
    }

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
      return self._hydrate_collection_block(block, current_node_path=current_node_path)

    # default: plain asdict
    return asdict(block)

  def _hydrate_collection_block(self, block: CollectionBlock, current_node_path: str) -> Dict[str, Any]:
    """Attach layout defaults + page-1 items + paging metadata to a collection block."""
    data = asdict(block)

    # ---- 1) Merge layout defaults (backend owns defaults) ----
    layout_dict = asdict(block.layout) if block.layout else {}
    mode = (layout_dict.get("mode") or "grid")
    defaults = DEFAULT_COLLECTION_LAYOUTS.get(mode, DEFAULT_COLLECTION_LAYOUTS["grid"])
    data["layout"] = _deep_merge(defaults, layout_dict)

    # ---- 2) Resolve candidate node paths ----
    candidates = self._resolve_collection_candidates(block, current_node_path=current_node_path)

    # ---- 3) Apply sort + limit ----
    candidates = self._apply_collection_sort(candidates, sort=block.sort)

    if isinstance(block.limit, int) and block.limit > 0:
      candidates = candidates[:block.limit]

    total_items = len(candidates)

    # ---- 4) Paging (page 1 only for now) ----
    paging_cfg = asdict(block.paging) if block.paging else {}
    paging_enabled = bool(paging_cfg.get("enabled", False))

    page_size = paging_cfg.get("page_size")
    if paging_enabled:
      if not isinstance(page_size, int) or page_size <= 0:
        page_size = 24  # sane default when enabled but unspecified
    else:
      # when paging disabled, return all candidates (or limited above)
      page_size = total_items

    page = 1
    start = 0
    end = start + (page_size or 0)

    page_paths = candidates[start:end] if page_size else []

    # ---- 5) Attach items payloads ----
    data["items"] = [self._collection_item_payload(p) for p in page_paths]

    # ---- 6) Attach paging metadata (so UI can show Load More / page numbers) ----
    total_pages = 1
    if page_size and page_size > 0:
      total_pages = (total_items + page_size - 1) // page_size

    data["paging"] = {
      "enabled": paging_enabled,
      "mode": paging_cfg.get("mode", "load_more"),
      "page": page,
      "page_size": page_size,
      "total_items": total_items,
      "total_pages": total_pages,
      "has_more": (end < total_items) if page_size else False,
    }

    return data

  def _resolve_collection_candidates(self, block: CollectionBlock, current_node_path: str) -> List[str]:
    """
    Resolve the node paths for this collection, using the in-memory graph.
    For now we treat source="folder" + path="artists" as "direct children under that node".
    """
    if block.source != "folder" or not block.path:
      return []

    base = block.path.strip("/")

    # Fast path: if we have direct children index
    if base in self.children_by_parent:
      return list(self.children_by_parent[base])

    # Fallback: prefix scan (direct children only)
    prefix = base + "/"
    out: List[str] = []
    for p in self.nodes.keys():
      if not p.startswith(prefix):
        continue
      rest = p[len(prefix):]
      if "/" in rest:
        continue  # not a direct child
      out.append(p)

    return out

  def _apply_collection_sort(self, paths: List[str], sort: Optional[str]) -> List[str]:
    sort = sort or "name_asc"

    if sort == "random":
      import random
      out = paths[:]
      random.shuffle(out)
      return out

    if sort == "name_asc":
      return sorted(paths, key=lambda p: self._collection_sort_title(p).lower())

    if sort == "name_desc":
      return sorted(paths, key=lambda p: self._collection_sort_title(p).lower(), reverse=True)

    # Future: date-based sorts, etc. (tracks/albums)
    # if sort == "created_at_desc": ...
    # if sort == "release_date_desc": ...

    return paths

  def _collection_sort_title(self, node_path: str) -> str:
    node = self.get_node(node_path)
    if node and node.preview and node.preview.title:
      return node.preview.title
    if node and node.title:
      return node.title
    return node_path


  def _collection_item_payload(self, node_path: str) -> Dict[str, Any]:
    """Return lightweight data for collection cards."""
    node = self.get_node(node_path)
    if not node:
      return {"path": node_path}

    return {
      "path": node.meta.path,
      "layout": node.meta.layout,
      "slug": node.meta.slug,
      "display_name": node.meta.display_name,
      "preview": asdict(node.preview) if node.preview else None,
      # optional: include some metadata for client-side sort/filter later
      "meta": {
        # "genres": node.meta.extra.get("genres"),
        # "tags": node.meta.extra.get("tags"),
        # "created_at": node.meta.extra.get("created_at"),
      },
    }

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
      layout_data = data.get("layout") or None
      paging_data = data.get("paging") or None

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

      return CollectionBlock(
        source=data.get("source", "folder"),
        path=data.get("path"),
        layout=layout,
        card=data.get("card"),
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