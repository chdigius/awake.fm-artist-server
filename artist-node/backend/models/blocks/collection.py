"""Collection block for displaying lists of items."""
from dataclasses import dataclass
from typing import Dict, List, Optional, Literal, Any


CollectionLayoutMode = Literal["grid", "list", "carousel"]
CollectionPagingMode = Literal["load_more", "pages"]
CollectionSourceType = Literal["folder", "roster", "tag", "query", "media_folder"]


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
class CollectionMedia:
  """
  Media configuration for audio/video collections.

  Defines how media files should be displayed and played, including
  audio player settings and visualizer configuration.
  """
  type: Literal["audio", "video"] = "audio"       # media type
  player: Optional[Dict[str, Any]] = None         # player config (autoplay, controls, etc.)
  visualizer: Optional[Dict[str, Any]] = None     # visualizer config (id, seed_from, options)


@dataclass
class CollectionThumbnail:
  """
  Thumbnail configuration for collection items.

  Supports generative thumbnails from seed images with various color modes
  and pattern overlays, or static thumbnails.
  """
  type: Literal["generative_from_seed", "static"] = "generative_from_seed"
  seedImage: Optional[str] = None                # path to seed image
  style: Optional[Dict[str, Any]] = None         # { pattern, colorMode, blendSeed, blendMode }
  seedFrom: Optional[str] = None                 # what to seed from: "filename", "title", etc.


@dataclass
class CollectionBlock:
  type: Literal["collection"] = "collection"

  # where the items come from
  source: CollectionSourceType = "folder"
  path: Optional[str] = None          # filesystem path (folder: "artists", media_folder: "music/sets/audio/bassdrive")
  pattern: Optional[str] = None       # file pattern for media_folder source (e.g. "*.mp3", "*.flac")

  # presentation + behavior
  layout: Optional[CollectionLayout] = None
  card: Optional[str] = None          # which card component/template to use, e.g. "artist"

  # media configuration (for audio/video collections)
  media: Optional[CollectionMedia] = None

  # thumbnail configuration (for generative or static thumbnails)
  thumbnail: Optional[CollectionThumbnail] = None

  # data shaping
  sort: Optional[str] = None          # "name_asc", "random", etc.
  sort_options: Optional[List[Dict[str, str]]] = None  # [{ "key": "name_asc", "label": "Name (A–Z)" }]
  limit: Optional[int] = None         # hard cap from backend
  filters: Optional[Dict[str, Any]] = None  # future: genre filters, tags, etc.

  # paging
  paging: Optional[CollectionPaging] = None   # { enabled, page_size, mode }

  # UX when empty
  empty_state: Optional[Dict[str, str]] = None  # { "heading": "...", "body": "..." }

