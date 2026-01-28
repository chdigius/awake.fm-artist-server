"""Content block types for the artist node CMS."""
from typing import Union, Literal

from backend.models.blocks.hero import HeroBlock, SigilConfig
from backend.models.blocks.section import SectionBlock
from backend.models.blocks.markdown import MarkdownBlock
from backend.models.blocks.subpage import SubpageBlock
from backend.models.blocks.collection import (
  CollectionBlock,
  CollectionLayout,
  CollectionPaging,
  CollectionMedia,
  CollectionLayoutMode,
  CollectionPagingMode,
  CollectionSourceType,
)
from backend.models.blocks.audio_player import AudioPlayerBlock, VisualizerConfig


# Block union type for type hints
Block = Union[
  HeroBlock,
  SectionBlock,
  MarkdownBlock,
  SubpageBlock,
  CollectionBlock,
  AudioPlayerBlock,
]

# Block type literal for runtime checks
BlockType = Literal[
  "hero",
  "section",
  "markdown",
  "subpage",
  "collection",
  "audio_player",
]


__all__ = [
  # Blocks
  "HeroBlock",
  "SectionBlock",
  "MarkdownBlock",
  "SubpageBlock",
  "CollectionBlock",
  "AudioPlayerBlock",
  # Configs
  "SigilConfig",
  "CollectionLayout",
  "CollectionPaging",
  "CollectionMedia",
  "VisualizerConfig",
  # Types
  "Block",
  "BlockType",
  "CollectionLayoutMode",
  "CollectionPagingMode",
  "CollectionSourceType",
]

