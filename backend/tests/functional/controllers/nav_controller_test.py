import pytest
import pytest_asyncio

from quart import Quart

from backend.models.content_graph import ContentGraph, ContentNode, NodeMeta, SubpageBlock
from backend.graph.graph_ops import GraphOps
from backend.app import create_app


@pytest.fixture
def sample_graph() -> ContentGraph:
  graph = ContentGraph(root_content_path="server")

  server_node = ContentNode(
    meta=NodeMeta(
      path="server",
      parent_path=None,
      layout="server",
      slug="server",
      display_name="My Server",
      extra={},
    )
  )

  graph.register_node(server_node)

  artist_node = ContentNode(
    meta=NodeMeta(
      path="artists",
      parent_path="server",
      layout="artist",
      slug="artists",
      display_name="Artists",
      extra={},
    ),
    title="Artists"
  )

  graph.register_node(artist_node)

  zol_node = ContentNode(
    meta=NodeMeta(
      path="artists/zol",
      parent_path="artists",
      layout="artist",
      slug="zol",
      display_name="ZØL",
      extra={},
    ),
    title="ZØL",
  )

  graph.register_node(zol_node)

  dissolvr_node = ContentNode(
    meta=NodeMeta(
      path="artists/dissolvr",
      parent_path="artists",
      layout="artist",
      slug="dissolvr",
      display_name="DISSØLVR",
      extra={},
    ),
    title="DISSØLVR",
  )

  graph.register_node(dissolvr_node)

  releases_node = ContentNode(
    meta=NodeMeta(
      path="server/pages/releases",
      parent_path="server",
      layout="page",
      slug="releases",
      display_name="Releases",
      extra={},
    ),
    title="Releases",
  )

  graph.register_node(releases_node)

  store_node = ContentNode(
    meta=NodeMeta(
      path="server/pages/store",
      parent_path="server",
      layout="page",
      slug="store",
      display_name="Store",
      extra={},
    ),
    title="Store",
  )

  graph.register_node(store_node)

  return graph

@pytest.fixture
def nav_config() -> dict:
  return {
    "items": [
      {"label": "Home", "ref": "."},
      {"label": "Artists", "ref": "artists", "auto_children": "from_subpages"},
      {"label": "Releases", "ref": "server/pages/releases"},
      {"label": "Store", "ref": "server/pages/store"},
    ]
  }

@pytest_asyncio.fixture
async def client(sample_graph: ContentGraph, nav_config:dict):
  graph_ops = GraphOps.from_graph(sample_graph, nav_config = nav_config)
  app: Quart = create_app(graph_ops)
  app.config.update(TESTING=True)

  async with app.test_client() as test_client:
    yield test_client

@pytest.fixture
def sample_graph_with_subpages() -> ContentGraph:
  graph = ContentGraph(root_content_path="server")

  server = ContentNode(
    meta=NodeMeta(
      path="server",
      parent_path=None,
      layout="server",
      slug="server",
      display_name="My Server",
      extra={},
    ),
    title="My Server",
  )
  graph.register_node(server)

  artists = ContentNode(
    meta=NodeMeta(
      path="artists",
      parent_path="server",
      layout="artist",
      slug="artists",
      display_name="Artists",
      extra={},
    ),
    title="Artists",
    content=[
      SubpageBlock(
        ref="artists/zol",
        label="ZØL",
        nav=True,
      ),
      SubpageBlock(
        ref="artists/dissolvr",
        label="DISSØLVR",
        nav=True,
      ),
      SubpageBlock(
        ref="artists/hidden",
        label="Hidden",
        nav=False,
      )
    ]
  )
  graph.register_node(artists)

  zol = ContentNode(
    meta=NodeMeta(
      path="artists/zol",
      parent_path="artists",
      layout="artist",
      slug="zol",
      display_name="ZØL",
      extra={},
    ),
    title="ZØL",
  )
  graph.register_node(zol)

  dissolvr = ContentNode(
    meta=NodeMeta(
      path="artists/dissolvr",
      parent_path="artists",
      layout="artist",
      slug="dissolvr",
      display_name="DISSØLVR",
      extra={},
    ),
    title="DISSØLVR",
  )

  graph.register_node(dissolvr)

  return graph

@pytest.fixture
def nav_config_with_auto_children() -> dict:
  return {
    "items": [
      {"label": "Home", "ref": "."},
      {"label": "Artists", "ref": "artists", "auto_children": "from_subpages"},
    ]
  }

@pytest_asyncio.fixture
async def client_with_auto_children(sample_graph_with_subpages: ContentGraph, nav_config_with_auto_children:dict):
  graph_ops = GraphOps.from_graph(sample_graph_with_subpages, nav_config = nav_config_with_auto_children)
  app: Quart = create_app(graph_ops) 
  app.config.update(TESTING=True)
  async with app.test_client() as test_client:
    yield test_client

@pytest.mark.asyncio
async def test_nav_endpoint_returns_expected_structure(client):
  resp = await client.get("/api/nav")
  assert resp.status_code == 200

  data = await resp.get_json()
  assert('items' in data)

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

  print(await resp.json)


@pytest.mark.asyncio
async def test_nav_auto_children_from_subpages(client_with_auto_children):
  resp = await client_with_auto_children.get("/api/nav")
  assert resp.status_code == 200

  data = await resp.get_json()

  items = data['items']
  assert len(items) == 2

  artists = items[1]
  assert artists['label'] == 'Artists'
  assert artists['href'] == '/artists'
  assert len(artists['children']) == 2

  labels = [child['label'] for child in artists['children']]
  hrefs = [child['href'] for child in artists['children']]

  assert labels == ['ZØL', 'DISSØLVR']
  assert hrefs == ['/artists/zol', '/artists/dissolvr']
