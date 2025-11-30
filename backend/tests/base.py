"""
Base test class providing shared fixtures and utilities for all tests.
"""
import json
from pathlib import Path
from backend.models.content_graph import ContentGraph


class ContentGraphTestBase:
  """
  Base class for tests that need access to the content graph fixture.
  
  Inherit from this class to get access to:
  - self.graph: ContentGraph loaded from content_graph_test.json
  - self.get_nav_config_basic(): Basic nav config
  - self.get_nav_config_with_pages(): Nav config with additional pages
  """
  
  @classmethod
  def setup_class(cls):
    """Load the content graph fixture once per test class."""
    fixture_path = Path('backend/tests/resources/content_graph_test.json')
    
    with fixture_path.open('r') as f:
      content_graph_data = json.load(f)
    
    cls.graph = ContentGraph.from_dict(content_graph_data)
  
  @staticmethod
  def get_nav_config_basic() -> dict:
    """Basic navigation config for testing."""
    return {
      "items": [
        {"label": "Home", "ref": "."},
        {"label": "Artists", "ref": "artists", "auto_children": "from_subpages"},
        {"label": "Releases", "ref": "server/pages/releases"},
        {"label": "Store", "ref": "server/pages/store"},
      ]
    }
  
  @staticmethod
  def get_nav_config_with_pages() -> dict:
    """Navigation config with additional page references."""
    return {
      "items": [
        {"label": "Home", "ref": "."},
        {"label": "Artists", "ref": "artists", "auto_children": "from_subpages"},
        {"label": "Releases", "ref": "server/pages/releases"},
        {"label": "Store", "ref": "server/pages/store"},
      ]
    }

