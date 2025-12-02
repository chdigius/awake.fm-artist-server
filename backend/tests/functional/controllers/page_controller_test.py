import pytest

from backend.tests.base import ContentGraphTestBase


class TestPageController(ContentGraphTestBase):
  """Test page controller endpoints."""


  @pytest.mark.asyncio
  async def test_page_endpoint_returns_root_when_no_path(self, client):
    resp = await client.get("/api/page")
    assert resp.status_code == 200

    data = await resp.get_json()
    assert data["path"] == "server"
    assert data["title"] == "Awake FM Node 001"
    assert isinstance(data["content"], list)
    assert data["content"][0]["type"] == "hero"


  @pytest.mark.asyncio
  async def test_page_endpoint_returns_artist_page(self, client):
    resp = await client.get("/api/page?path=artists/zol")
    assert resp.status_code == 200

    data = await resp.get_json()
    print(data)
    assert data["path"] == "artists/zol"
    # assert data["title"] == "ZØL"
    assert isinstance(data["content"], list)

    # should have a music section with a subpage block
    section = data["content"][0]
    assert section["type"] == "section"
    assert section["id"] == "music"
    assert len(section["blocks"]) == 1
    sub = section["blocks"][0]
    assert sub["type"] == "subpage"
    assert sub["ref"] == "artists/zol/tracks"

  @pytest.mark.asyncio
  async def test_page_endpoint_404_for_unknown_path(self, client):
    resp = await client.get("/api/page?path=does/not/exist")
    assert resp.status_code == 404

    data = await resp.get_json()
    assert "error" in data