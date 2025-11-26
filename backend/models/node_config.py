from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List, Dict, Any

import yaml

@dataclass
class NodeConfig:
  """
  In-memory representation of an artist node's basic configuration.
  """
  base_dir: Path
  content_root: Path
  root_content_path: str

  @classmethod
  def load(cls, base_dir: Path | str= '.') -> NodeConfig:
    """
    Load configuration from:
    - base_dir/config/node.yaml
    - <content_root>/_meta.yaml
    """
    base = Path(base_dir).resolve()

    # load config/node.yaml
    node_config_path = base / 'config' / 'node.yaml'
    if not node_config_path.exists():
      raise FileNotFoundError(f"Node configuration file not found: {node_config_path}")

    with node_config_path.open("r", encoding="utf-8") as f:
      raw = yaml.safe_load(f) or {}

    content_root_rel = raw.get('content_root', 'content')
    content_root = (base / content_root_rel).resolve()

    # load <content_root>/_meta.yaml
    meta_path = content_root / '_meta.yaml'
    if not meta_path.exists():
      raise FileNotFoundError(f"Content root meta file not found: {meta_path}")

    with meta_path.open("r", encoding="utf-8") as f:
      meta_raw = yaml.safe_load(f) or {}

    root_content_path = meta_raw.get('root_content_path')
    if not root_content_path:
      raise ValueError("root_content_path is required in _meta.yaml")

    # TODO - CJD - add support for other fields as needed
    return cls(
      base_dir=base,
      content_root=content_root,
      root_content_path=root_content_path
    )

  @property
  def nav_path(self) -> Path:
    """
    Absolute path to the nav.yaml for the current root_content.

    Example:
      base_dir      = /srv/artist-node
      content_root  = /srv/artist-node/content
      root_content  = "server"

      → /srv/artist-node/content/server/nav.yaml
    """
    return (self.content_root / self.root_content_path / "nav.yaml").resolve()
