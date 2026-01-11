# builder.py
from __future__ import annotations

import os
import yaml
import json

from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import asdict


def normalize_media_path(path_str: Optional[str]) -> Optional[str]:
  """
  Normalize media paths so the frontend can resolve them:
  - Convert Windows backslashes to forward slashes
  - Ensure a leading slash for site-root relative assets
  - Leave full URLs (http/https) untouched
  """
  if not path_str:
    return path_str

  # replace backslashes
  normalized = path_str.replace("\\", "/")

  # if it's already absolute URL, leave it
  if normalized.startswith("http://") or normalized.startswith("https://"):
    return normalized

  # ensure leading slash for site-root static serving
  if not normalized.startswith("/"):
    normalized = "/" + normalized

  return normalized


from backend.models.content_graph import ContentGraph
from backend.models.node import ContentNode, NodeMeta, NodePreview
from backend.models.blocks import (
  Block,
  HeroBlock,
  SectionBlock,
  MarkdownBlock,
  SubpageBlock,
  CollectionBlock,
  CollectionLayout,
  CollectionPaging,
  AudioPlayerBlock,
  SigilConfig,
  VisualizerConfig,
)

def load_yaml(path: Path) -> Dict[str, Any]:
  if not path.exists():
    return {}

  with open(path, 'r', encoding='utf-8') as f:
    data = yaml.safe_load(f) or {}
  if not isinstance(data, dict):
    raise ValueError(f"Expected mapping at path, got {type(data)} instead")
  return data

def infer_layout_from_path(path_str: str) -> str:
  """
  Fallback layout if folder _meta.yaml is missing or doesn't specify one.
  """
  # NOTE - CJD - This is intentionally simple for now

  parts = path_str.split("/")

  if path_str == "server":
    return "server"

  if len(parts) >= 2 and parts[0] == "artists" and len(parts) == 2:
    # e.g. artists/zol
    return "artist"

  if "albums" in parts:
    return "album"

  if "tracks" in parts:
    return "track"

  if "sets" in parts:
    return "set"

  # generic catch all if we can't infer a more specific layout
  return "page"

def parse_block(raw: Dict[str, Any]) -> Block:
  block_type = raw.get("type")

  if block_type == "hero":
    # Parse sigil config if present
    sigil_raw = raw.get("sigil")
    sigil = None
    if sigil_raw:
      sigil = SigilConfig(
        type=sigil_raw.get("type", "p5"),
        id=sigil_raw.get("id"),
        src=sigil_raw.get("src"),
        alt=sigil_raw.get("alt"),
        options=sigil_raw.get("options"),
      )
    
    return HeroBlock(
      heading=raw.get("heading", ""),
      subheading=raw.get("subheading", ""),
      body=raw.get("body", ""),
      cta=raw.get("cta", ""),
      sigil=sigil,
      background=normalize_media_path(raw.get("background")),
    )

  if block_type == "section":
    child_blocks = [parse_block(b) for b in raw.get("blocks", []) or []]
    return SectionBlock(
      id=raw.get("id"),
      label=raw.get("label", ""),
      blocks=child_blocks,
      align=raw.get("align"),
    )

  if block_type == "markdown":
    return MarkdownBlock(body=raw.get("body", ""))

  if block_type == "subpage":
    return SubpageBlock(
      ref=raw.get("ref"),
      label=raw.get("label"),
      nav=raw.get("nav", False)
    )

  if block_type == "collection":
    # Parse layout config if present
    layout_raw = raw.get("layout")
    layout = None
    if layout_raw:
      layout = CollectionLayout(
        mode=layout_raw.get("mode", "grid"),
        # Grid-specific
        columns=layout_raw.get("columns"),
        gap=layout_raw.get("gap"),
        align=layout_raw.get("align"),
        max_rows=layout_raw.get("max_rows"),
        pagination=layout_raw.get("pagination"),
        # List-specific
        dense=layout_raw.get("dense"),
        show_dividers=layout_raw.get("show_dividers"),
        show_avatar=layout_raw.get("show_avatar"),
        show_meta=layout_raw.get("show_meta"),
        max_items=layout_raw.get("max_items"),
        # Carousel-specific
        slides_per_view=layout_raw.get("slides_per_view"),
        spacing=layout_raw.get("spacing"),
        loop=layout_raw.get("loop"),
        autoplay=layout_raw.get("autoplay"),
        controls=layout_raw.get("controls"),
        snap_align=layout_raw.get("snap_align"),
        max_width=layout_raw.get("max_width"),
      )
    
    # Parse paging config if present
    paging_raw = raw.get("paging")
    paging = None
    if paging_raw:
      paging = CollectionPaging(
        enabled=paging_raw.get("enabled", False),
        page_size=paging_raw.get("page_size"),
        mode=paging_raw.get("mode", "load_more"),
      )
    
    return CollectionBlock(
      source=raw.get("source", "folder"),
      path=raw.get("path"),
      layout=layout,
      card=raw.get("card"),
      sort=raw.get("sort"),
      sort_options=raw.get("sort_options"),
      limit=raw.get("limit"),
      filters=raw.get("filters"),
      paging=paging,
      empty_state=raw.get("empty_state"),
    )

  if block_type == "audio_player":
    # Parse visualizer config if present
    visualizer_raw = raw.get("visualizer")
    visualizer = None
    if visualizer_raw:
      visualizer = VisualizerConfig(
        type=visualizer_raw.get("type", "p5"),
        id=visualizer_raw.get("id", "spectrum-bars"),
        options=visualizer_raw.get("options"),
      )
    
    return AudioPlayerBlock(
      src=raw.get("src", ""),
      title=raw.get("title"),
      artist=raw.get("artist"),
      artwork=raw.get("artwork"),
      visualizer=visualizer,
    )

  return MarkdownBlock(body=f"Unknown block type: {block_type}")


def build_node_from_directory(node_dir: Path, content_root: Path) -> ContentNode:
  """
  Given a directory that contains an index.yaml, construct a ContentNode.
  """
  # 1. Compute relative path and parent path
  rel_path = node_dir.relative_to(content_root)

  if rel_path == Path("."):
    path_str = ""
    parent_path = ""
  else:
    path_str = rel_path.as_posix()
    parent_rel = rel_path.parent
    parent_path = None if parent_rel == Path(".") else parent_rel.as_posix()

  # 2. Load index.yaml data
  index_data = load_yaml(node_dir / "index.yaml")

  title = index_data.get("title")
  tagline = index_data.get("tagline")
  background = normalize_media_path(index_data.get("background"))  # page-level background image

  # 3. Load _meta.yaml data
  folder_meta = load_yaml(node_dir / "_meta.yaml")

  # 4. Determine layout
  layout = folder_meta.get("layout", infer_layout_from_path(path_str))

  # 5. Construct NodeMeta
  meta = NodeMeta(
    path = path_str or "server",
    parent_path = parent_path,
    layout = layout,
    slug = folder_meta.get("slug"),
    display_name = folder_meta.get("display_name"),
    theme = folder_meta.get("theme"),  # per-node theme override
    effects = folder_meta.get("effects", []),  # visual FX layers: ["crt", "chroma", "glow"]
    # NOTE - CJD - Extra is intentionally not used for now, decide later if we want to handle random user defined attributes
  )

  # 6. Construct NodePreview
  preview_data = index_data.get("preview", {})
  preview: Optional[NodePreview] = None

  if preview_data:
    preview = NodePreview(
      title=preview_data.get("title", meta.display_name),
      subtitle=preview_data.get("subtitle"),
      image=preview_data.get("image"),
      badge=preview_data.get("badge"),
      blurb=preview_data.get("blurb"),
    )

  # 7. Construct content blocks
  raw_blocks: List[Dict[str, Any]] = index_data.get("content", [])
  content_blocks: List[Block] = [parse_block(b) for b in raw_blocks]

  # 8. Return the ContentNode
  return ContentNode(
    meta=meta,
    title=title,
    tagline=tagline,
    background=background,
    preview=preview,
    content=content_blocks,
  )

# ------ Graph Builder -------
def load_content_root_meta(content_root: Path) -> Dict[str, Any]:
  """
  Load content/_meta.yaml if present
  Used for things like root_content and theme
  """
  return load_yaml(content_root / "_meta.yaml")

def build_content_graph(content_root: Path) -> ContentGraph:
  """
  Walk the content/ tree, build a ContentGraph from all the folders that contain an index.yaml
  """
  content_root = content_root.resolve()

  #1 Global content meta
  root_meta = load_content_root_meta(content_root)
  root_content_path = root_meta.get("root_content", "server")  # e.g 'server' or 'artists/zol'
  root_theme = root_meta.get("theme")  # default theme for the entire graph

  graph = ContentGraph(root_content_path=root_content_path, root_theme=root_theme)

  #2 recursively walk directories
  for dirpath, dirnames, filenames in os.walk(content_root):
    dir_path = Path(dirpath)

    # Only treat directories that contain an index.yaml as nodes
    if "index.yaml" not in filenames:
      continue

    node = build_node_from_directory(dir_path, content_root)
    graph.register_node(node)

  #3 Optionally compute additional indexes (artists, albums, tracks) here
  _build_additional_indexes(graph)

  return graph

def _build_additional_indexes(graph: ContentGraph) -> None:
  """
  Place holder for extra passes over the graph to compute:
  - graph.artists
  - graph.albums_by_artist
  - graph.tracks_by_album etc
  """

  for path, node in graph.nodes.items():
    parts = path.split("/")

  if len(parts) >= 2 and parts[0] == "artists":
    graph.artists.append(path)


if __name__ == "__main__":
  # TODO - CJD - option to pass in content path here
  print("Building content graph...")
  content_root = Path("../content")
  graph = build_content_graph(content_root)

  os.makedirs("build", exist_ok=True)
  with open("build/content_graph.json", "w") as f:
    json.dump(asdict(graph), f, indent=2)

  print(json.dumps(asdict(graph), indent=2))