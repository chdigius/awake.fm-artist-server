"""Collection resolution, sorting, and pagination logic."""
from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from typing import Dict, List, Optional, Any, TYPE_CHECKING
import glob

from backend.models.blocks import CollectionBlock, CollectionLayout, CollectionPaging
from backend.models.defaults import DEFAULT_COLLECTION_LAYOUTS, _deep_merge

if TYPE_CHECKING:
  from backend.models.content_graph import ContentGraph


class CollectionResolver:
  """
  Handles collection resolution, sorting, and pagination.
  
  Separated from ContentGraph to keep concerns composable and make it easier
  to add new collection sources (roster, tags, queries) without bloating the graph class.
  """
  
  def __init__(self, graph: "ContentGraph"):
    self.graph = graph
  
  def resolve_collection(
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
    current_node_path: str = "server",
  ) -> Dict[str, Any]:
    """
    Resolve + paginate a collection and return a frontend-friendly payload.
    
    This is the main entry point for the /api/collection endpoint.
    """
    # Normalize
    page = max(1, int(page or 1))
    page_size = max(1, int(page_size or 24))

    # Build a temporary CollectionBlock (so we can reuse logic cleanly)
    temp_block = CollectionBlock(
      source=source or "folder",
      path=path,
      pattern=pattern,
      sort=sort,
      limit=limit,
      card=card,
      layout=CollectionLayout(mode=(layout or {}).get("mode", "grid")) if layout else None,
      paging=CollectionPaging(enabled=True, page_size=page_size, mode="load_more"),
    )

    # Merge layout defaults
    layout_dict = layout or {}
    mode = (layout_dict.get("mode") or "grid")
    defaults = DEFAULT_COLLECTION_LAYOUTS.get(mode, DEFAULT_COLLECTION_LAYOUTS["grid"])
    merged_layout = _deep_merge(defaults, layout_dict)

    # Resolve candidates
    candidates = self._resolve_candidates(temp_block, current_node_path=current_node_path)

    # Sort + limit
    candidates = self._apply_sort(candidates, sort=sort, parent_path=path)

    if isinstance(limit, int) and limit > 0:
      candidates = candidates[:limit]

    total_items = len(candidates)
    total_pages = (total_items + page_size - 1) // page_size if page_size else 1

    # Slice for current page
    start = (page - 1) * page_size
    end = start + page_size
    page_paths = candidates[start:end]

    items = [self._item_payload(p, source_type=source) for p in page_paths]

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
  
  def hydrate_collection_block(
    self,
    block: CollectionBlock,
    current_node_path: str
  ) -> Dict[str, Any]:
    """
    Attach layout defaults + page-1 items + paging metadata to a collection block.
    
    Used when hydrating a page payload that contains collection blocks.
    """
    data = asdict(block)

    # ---- 1) Merge layout defaults (backend owns defaults) ----
    layout_dict = asdict(block.layout) if block.layout else {}
    mode = (layout_dict.get("mode") or "grid")
    defaults = DEFAULT_COLLECTION_LAYOUTS.get(mode, DEFAULT_COLLECTION_LAYOUTS["grid"])
    data["layout"] = _deep_merge(defaults, layout_dict)

    # ---- 2) Resolve candidate node paths ----
    candidates = self._resolve_candidates(block, current_node_path=current_node_path)

    # ---- 3) Apply sort + limit ----
    candidates = self._apply_sort(candidates, sort=block.sort, parent_path=block.path)

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
    data["items"] = [self._item_payload(p, source_type=block.source) for p in page_paths]

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
  
  def _resolve_candidates(
    self,
    block: CollectionBlock,
    current_node_path: str
  ) -> List[str]:
    """
    Resolve the node paths for this collection, using the in-memory graph.
    
    Currently supports:
    - source="folder" + path="artists" → direct children under that node
    - source="media_folder" + path="music/sets/audio" → scan filesystem for media files
    
    Future: source="roster", source="tag", source="query"
    """
    if block.source == "folder":
      return self._resolve_folder_source(block.path)
    
    if block.source == "media_folder":
      return self._resolve_media_folder_source(block.path, block.pattern, current_node_path)
    
    # Future sources:
    # elif block.source == "roster":
    #   return self._resolve_roster_source(block.path, current_node_path)
    # elif block.source == "tag":
    #   return self._resolve_tag_source(block.filters)
    # elif block.source == "query":
    #   return self._resolve_query_source(block.filters)
    
    return []
  
  def _resolve_folder_source(self, path: Optional[str]) -> List[str]:
    """Resolve collection items from a folder path (direct children only)."""
    if not path:
      return []

    base = path.strip("/")

    # Fast path: if we have direct children index
    if base in self.graph.children_by_parent:
      return list(self.graph.children_by_parent[base])

    # Fallback: prefix scan (direct children only)
    prefix = base + "/"
    out: List[str] = []
    for p in self.graph.nodes.keys():
      if not p.startswith(prefix):
        continue
      rest = p[len(prefix):]
      if "/" in rest:
        continue  # not a direct child
      out.append(p)

    return out

  def _resolve_media_folder_source(
    self,
    path: Optional[str],
    pattern: Optional[str],
    current_node_path: str
  ) -> List[str]:
    """
    Scan filesystem for media files matching pattern.
    
    Returns list of file paths relative to content root.
    Each file path can be used as a virtual 'item' in the collection.
    """
    if not path:
      return []

    # Default pattern if none specified
    if not pattern:
      pattern = "*.mp3"

    # Resolve absolute filesystem path
    # current_node_path is like "server" or "artists/awake_fm_legacy"
    # path can be:
    #   - Relative to current node: "music/sets/audio/bassdrive"
    #   - Absolute from content root: "artists/awake_fm_legacy/music/sets/audio/bassdrive"
    
    # Find content directory (relative to backend module location)
    # __file__ is at: awake.fm-artist-server/artist-node/backend/models/collection_resolver.py
    # backend is at: awake.fm-artist-server/artist-node/backend/
    # content is at: awake.fm-artist-server/content/
    backend_dir = Path(__file__).parent.parent  # models -> backend
    artist_node_dir = backend_dir.parent  # backend -> artist-node
    repo_root = artist_node_dir.parent  # artist-node -> awake.fm-artist-server
    content_root = repo_root / "content"
    
    # If path starts with a known top-level dir (server/artists/pages), treat as absolute from content root
    # Otherwise, treat as relative to current_node_path
    path_parts = path.split("/")
    is_absolute_from_content_root = path_parts[0] in ["server", "artists", "pages"]
    
    if is_absolute_from_content_root:
      # Path is absolute from content root, don't prepend current_node_path
      media_dir = content_root / path
    elif current_node_path:
      # Path is relative to current node
      media_dir = content_root / current_node_path / path
    else:
      # No current node, path is from content root
      media_dir = content_root / path

    if not media_dir.exists() or not media_dir.is_dir():
      return []

    # Scan for files matching pattern
    files = []
    for file_path in media_dir.glob(pattern):
      if file_path.is_file():
        # Return path relative to content root (for web-accessible URLs)
        rel_path = file_path.relative_to(content_root)
        # Store as string path that can be used as collection item identifier
        files.append(str(rel_path))

    return files

  def _apply_sort(self, paths: List[str], sort: Optional[str], parent_path: Optional[str] = None) -> List[str]:
    """Apply sorting to collection items.

    Priority:
    1. Explicit sort parameter (e.g., "random", "name_desc")
    2. collection_order from parent node's _meta.yaml
    3. Default: name_asc
    """
    # PRIORITY 1: Explicit sort parameter overrides everything
    if sort == "random":
      import random
      out = paths[:]
      random.shuffle(out)
      return out

    if sort == "name_asc":
      return sorted(paths, key=lambda p: self._sort_title(p).lower())

    if sort == "name_desc":
      return sorted(paths, key=lambda p: self._sort_title(p).lower(), reverse=True)

    # Future: date-based sorts, etc. (tracks/albums)
    # if sort == "created_at_desc": ...
    # if sort == "release_date_desc": ...

    # PRIORITY 2: Check for collection_order in parent node's meta
    if parent_path:
      parent_node = self.graph.get_node(parent_path)
      if parent_node and parent_node.meta.collection_order:
        order_map = {slug: idx for idx, slug in enumerate(parent_node.meta.collection_order)}

        # Sort by collection_order, with unlisted items at the end (alphabetically)
        def sort_key(path: str):
          # Extract slug from path (last segment)
          slug = path.split('/')[-1]
          # If in order map, use its index; otherwise use a high number + alphabetical
          if slug in order_map:
            return (0, order_map[slug], "")
          else:
            return (1, 999999, self._sort_title(path).lower())

        return sorted(paths, key=sort_key)

    # PRIORITY 3: Default to name_asc
    return sorted(paths, key=lambda p: self._sort_title(p).lower())
  
  def _sort_title(self, node_path: str) -> str:
    """Get the sortable title for a node."""
    node = self.graph.get_node(node_path)
    if node and node.preview and node.preview.title:
      return node.preview.title
    if node and node.title:
      return node.title
    return node_path
  
  def _item_payload(self, item_id: str, source_type: str = "folder") -> Dict[str, Any]:
    """
    Return lightweight data for collection cards.
    
    For source="folder": item_id is a node path, return node metadata
    For source="media_folder": item_id is a file path, return file metadata
    """
    if source_type == "media_folder":
      # Return media file metadata
      # TODO: Extract ID3 tags, duration, etc. from actual file
      # For now, return basic file info
      file_path = Path(item_id)
      return {
        "type": "media_file",
        "filename": file_path.name,
        "path": str(file_path),
        "title": file_path.stem,  # filename without extension
        "extension": file_path.suffix,
        # Future: ID3 metadata
        # "artist": ...,
        # "album": ...,
        # "duration": ...,
        # "artwork": ...,
      }
    
    # Default: folder source - look up content node
    node = self.graph.get_node(item_id)
    if not node:
      return {"path": item_id}

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

