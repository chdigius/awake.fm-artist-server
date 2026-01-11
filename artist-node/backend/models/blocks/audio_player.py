"""Audio player block with visualizer support."""
from dataclasses import dataclass
from typing import Dict, Optional, Literal, Any


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

