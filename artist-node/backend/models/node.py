"""Content node and metadata classes."""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any

from backend.models.blocks import (
  Block,
  HeroBlock,
  SectionBlock,
  MarkdownBlock,
  SubpageBlock,
  CollectionBlock,
  AudioPlayerBlock,
  SigilConfig,
  CollectionLayout,
  CollectionPaging,
  VisualizerConfig,
)


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
    For now we'll assume blocks were serialized with `asdict`, so we reconstruct
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

