"""
Base test class providing shared fixtures and utilities for all tests.
"""
import json
import pytest_asyncio
from pathlib import Path
from quart import Quart

from backend.models.content_graph import ContentGraph
from backend.graph.graph_ops import GraphOps
from backend.app import create_app


class ContentGraphTestBase:
  """
  Base class for tests that need access to the content graph fixture.
  
  Inherit from this class to get access to:
  - self.graph: ContentGraph loaded from content_graph_test.json
  - self.get_nav_config_basic(): Basic nav config
  - self.get_nav_config_with_pages(): Nav config with additional pages
  - client fixture: Quart test client for functional tests
  """
  
  @classmethod
  def setup_class(cls):
    """Load the content graph fixture once per test class."""
    fixture_path = Path('backend/tests/resources/content_graph_test.json')
    
    with fixture_path.open('r') as f:
      content_graph_data = json.load(f)
    
    cls.graph = ContentGraph.from_dict(content_graph_data)
  
  @pytest_asyncio.fixture
  async def client(self):
    """
    Quart test client fixture for functional tests.
    
    Creates a test app with the shared content graph and basic nav config.
    Override this in subclasses if you need custom nav config or app setup.
    """
    graph_ops = GraphOps.from_graph(self.graph, nav_config=self.get_nav_config_basic())
    app: Quart = create_app(graph_ops)
    app.config.update(TESTING=True)

    async with app.test_client() as test_client:
      yield test_client
  
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

