import pytest
import pytest_asyncio
from quart import Quart, jsonify
from quart.testing import QuartClient

def create_test_app() -> Quart:
  # TODO - CJD - replace with real app factory when we get there
  app = Quart(__name__)
  app.config.update(TESTING=True)

  sample_nav = {
    "items": [
      {
        "label": "Home",
        "href": "/"},
      {
        "label": "Artists",
        "href": "/artists",
        "children": [
          {
            "label": "zol",
            "href": "/artists/zol",
          },
          {
            "label": "dissolvr",
            "href": "/artists/dissolvr"},
        ]
      },
      {
        "label": "Releases",
        "href": "/releases",
      },
      {
        "label": "Store",
        "href": "/store",
      }
    ]
  }

  @app.get("/api/nav")
  async def nav():
    return jsonify(sample_nav)

  return app

@pytest_asyncio.fixture
async def client():
  app = create_test_app()  # TODO - CJD - swap in real create_app later
  async with app.test_client() as test_client:
    yield test_client

@pytest.mark.asyncio
async def test_nav_endpoint_returns_expected_structure(client: QuartClient):
  test_client = client

  resp = await test_client.get("/api/nav")
  assert resp.status_code == 200

  data = await resp.get_json()
  assert "items" in data

  items = data["items"]
  assert isinstance(items, list)
  assert len(items) == 4

  # Home
  home = items[0]
  assert home["label"] == "Home"
  assert home["href"] == "/"

  # children are not required here, but allowed
  if "children" in home:
    assert isinstance(home["children"], list)
  
  # Artists
  artists = items[1]
  assert artists["label"] == "Artists"
  assert artists["href"] == "/artists"
  assert "children" in artists
  assert isinstance(artists["children"], list)
  assert len(artists["children"]) == 2

  # zol
  zol = artists["children"][0]
  assert zol["label"] == "zol"
  assert zol["href"] == "/artists/zol"

  # dissolvr
  dissolvr = artists["children"][1]
  assert dissolvr["label"] == "dissolvr"
  assert dissolvr["href"] == "/artists/dissolvr"

  # Releases