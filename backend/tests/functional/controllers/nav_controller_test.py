import pytest
import pytest_asyncio

from quart import Quart

from backend.graph.graph_ops import GraphOps
from backend.app import create_app
from backend.tests.base import ContentGraphTestBase


class TestNavController(ContentGraphTestBase):
  """Test navigation controller endpoints using shared content graph fixture."""
  
  @pytest_asyncio.fixture
  async def client(self):
    """Test client with full nav config (Home, Artists, Releases, Store)."""
    graph_ops = GraphOps.from_graph(self.graph, nav_config=self.get_nav_config_basic())
    app: Quart = create_app(graph_ops)
    app.config.update(TESTING=True)

    async with app.test_client() as test_client:
      yield test_client

  @pytest.mark.asyncio
  async def test_nav_endpoint_returns_expected_structure(self, client):
    """Test that the nav endpoint returns correct structure with all nav items."""
    resp = await client.get("/api/nav")
    assert resp.status_code == 200

    data = await resp.get_json()
    assert 'items' in data

    items = data['items']
    assert isinstance(items, list)
    assert len(items) == 4

    home = items[0]
    artists = items[1]
    releases = items[2]
    store = items[3]

    assert home['label'] == 'Home'
    assert home['href'] == '/'

    assert artists['label'] == 'Artists'
    assert artists['href'] == '/artists'

    assert releases['label'] == 'Releases'
    assert releases['href'] == '/server/pages/releases'

    assert store['label'] == 'Store'
    assert store['href'] == '/server/pages/store'

  @pytest.mark.asyncio
  async def test_nav_auto_children_from_subpages(self, client):
    """Test that auto_children properly expands subpages from the artists node."""
    resp = await client.get("/api/nav")
    assert resp.status_code == 200

    data = await resp.get_json()

    items = data['items']
    artists = items[1]
    
    assert artists['label'] == 'Artists'
    assert artists['href'] == '/artists'
    assert 'children' in artists
    assert len(artists['children']) == 2

    # Verify the children hrefs (Unicode labels may vary)
    hrefs = [child['href'] for child in artists['children']]
    assert '/artists/zol' in hrefs
    assert '/artists/dissolvr' in hrefs
