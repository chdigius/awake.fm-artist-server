import pytest

from backend.tests.base import ContentGraphTestBase


class TestCollectionsController(ContentGraphTestBase):
  """Test collections controller endpoints."""

  @pytest.mark.asyncio
  async def test_collection_endpoint_requires_path(self, client):
    """Test that the collection endpoint returns 400 when path is missing."""
    resp = await client.get("/api/collection")
    assert resp.status_code == 400
    
    data = await resp.get_json()
    assert 'error' in data
    assert 'path' in data['error'].lower()

  @pytest.mark.asyncio
  async def test_collection_endpoint_returns_artists(self, client):
    """Test that the collection endpoint returns artists from the 'artists' folder."""
    resp = await client.get("/api/collection?source=folder&path=artists")
    assert resp.status_code == 200
    
    data = await resp.get_json()
    
    # Verify structure
    assert data['type'] == 'collection'
    assert data['source'] == 'folder'
    assert data['path'] == 'artists'
    assert 'items' in data
    assert 'paging' in data
    assert 'layout' in data
    
    # Verify items
    items = data['items']
    assert isinstance(items, list)
    assert len(items) == 2  # zol and dissolvr from test fixture
    
    # Verify item structure
    first_item = items[0]
    assert 'path' in first_item
    assert 'display_name' in first_item  # items use display_name, not title
    assert 'preview' in first_item

  @pytest.mark.asyncio
  async def test_collection_endpoint_paging(self, client):
    """Test that paging parameters work correctly."""
    # Get first page with page_size=1
    resp = await client.get("/api/collection?path=artists&page=1&page_size=1")
    assert resp.status_code == 200
    
    data = await resp.get_json()
    assert len(data['items']) == 1
    
    paging = data['paging']
    assert paging['page'] == 1
    assert paging['page_size'] == 1
    assert paging['total_items'] == 2
    assert paging['total_pages'] == 2
    # Note: has_next/has_prev may not be in the payload yet - check if they exist
    # If they're not there, that's fine for now
    
    # Get second page
    resp2 = await client.get("/api/collection?path=artists&page=2&page_size=1")
    assert resp2.status_code == 200
    
    data2 = await resp2.get_json()
    assert len(data2['items']) == 1
    
    paging2 = data2['paging']
    assert paging2['page'] == 2
    # Verify we're on the last page
    assert paging2['total_pages'] == 2

  @pytest.mark.asyncio
  async def test_collection_endpoint_with_sort(self, client):
    """Test that sort parameter is included in response."""
    resp = await client.get("/api/collection?path=artists&sort=name_asc")
    assert resp.status_code == 200
    
    data = await resp.get_json()
    assert data['sort'] == 'name_asc'
    
    # Items should be sorted (dissolvr comes before zol alphabetically)
    items = data['items']
    assert len(items) == 2
    # Note: actual sorting logic is tested in unit tests for ContentGraph

  @pytest.mark.asyncio
  async def test_collection_endpoint_with_limit(self, client):
    """Test that limit parameter caps the total items."""
    resp = await client.get("/api/collection?path=artists&limit=1")
    assert resp.status_code == 200
    
    data = await resp.get_json()
    
    # Even though there are 2 artists, limit=1 should cap it
    paging = data['paging']
    assert paging['total_items'] == 1
    assert len(data['items']) == 1

  @pytest.mark.asyncio
  async def test_collection_endpoint_with_card_type(self, client):
    """Test that card parameter is included in response."""
    resp = await client.get("/api/collection?path=artists&card=artist")
    assert resp.status_code == 200
    
    data = await resp.get_json()
    assert data['card'] == 'artist'

  @pytest.mark.asyncio
  async def test_collection_endpoint_with_layout_mode(self, client):
    """Test that layout mode parameter is merged into layout config."""
    resp = await client.get("/api/collection?path=artists&mode=list")
    assert resp.status_code == 200
    
    data = await resp.get_json()
    assert 'layout' in data
    assert data['layout']['mode'] == 'list'

  @pytest.mark.asyncio
  async def test_collection_endpoint_default_values(self, client):
    """Test that default values are applied when params are missing."""
    resp = await client.get("/api/collection?path=artists")
    assert resp.status_code == 200
    
    data = await resp.get_json()
    
    # Default source is 'folder'
    assert data['source'] == 'folder'
    
    # Default paging
    paging = data['paging']
    assert paging['page'] == 1
    assert paging['page_size'] == 24
    
    # Default layout mode is 'grid'
    assert data['layout']['mode'] == 'grid'

  @pytest.mark.asyncio
  async def test_collection_endpoint_invalid_page_params(self, client):
    """Test that invalid page parameters are handled gracefully."""
    # Invalid page number (string)
    resp = await client.get("/api/collection?path=artists&page=invalid")
    assert resp.status_code == 200
    data = await resp.get_json()
    assert data['paging']['page'] == 1  # defaults to 1
    
    # Invalid page_size
    resp2 = await client.get("/api/collection?path=artists&page_size=abc")
    assert resp2.status_code == 200
    data2 = await resp2.get_json()
    assert data2['paging']['page_size'] == 24  # defaults to 24

  @pytest.mark.asyncio
  async def test_collection_endpoint_nonexistent_path(self, client):
    """Test that requesting a nonexistent path returns empty collection."""
    resp = await client.get("/api/collection?path=nonexistent")
    assert resp.status_code == 200  # Returns 200 with empty items, not 404
    
    data = await resp.get_json()
    assert data['type'] == 'collection'
    assert data['path'] == 'nonexistent'
    assert len(data['items']) == 0  # No items found
    assert data['paging']['total_items'] == 0

  @pytest.mark.asyncio
  async def test_media_folder_collection_endpoint(self, client, tmp_path, monkeypatch):
    """Test that media_folder source scans filesystem for audio files."""
    from pathlib import Path

    # Create test media folder structure in temp directory
    test_audio_dir = tmp_path / "test_collection" / "audio"
    test_audio_dir.mkdir(parents=True, exist_ok=True)

    # Create test MP3 files (empty files are fine for testing)
    test_files = [
      "test_track_001.mp3",
      "test_track_002.mp3",
      "test_track_003.mp3",
    ]

    for filename in test_files:
      (test_audio_dir / filename).write_text("")

    # Mock the content root path resolution to use tmp_path
    def mock_resolve_media_folder(self, path, pattern, current_node_path):
      """Mock version that uses tmp_path as content root."""
      if not path:
        return []

      if not pattern:
        pattern = "*.mp3"

      # Use tmp_path as content root for testing
      media_dir = tmp_path / path

      if not media_dir.exists() or not media_dir.is_dir():
        return []

      files = []
      for file_path in media_dir.glob(pattern):
        if file_path.is_file():
          rel_path = file_path.relative_to(media_dir)
          files.append(str(rel_path))
      return files

    # Patch the resolver method
    from backend.models.collection_resolver import CollectionResolver
    monkeypatch.setattr(
      CollectionResolver,
      '_resolve_media_folder_source',
      mock_resolve_media_folder
    )

    # Test media_folder collection endpoint
    resp = await client.get(
      "/api/collection?"
      "source=media_folder&"
      "path=test_collection/audio&"
      "pattern=*.mp3&"
      "page=1&"
      "page_size=10"
    )

    assert resp.status_code == 200

    data = await resp.get_json()

    # Verify structure
    assert data['type'] == 'collection'
    assert data['source'] == 'media_folder'
    assert data['path'] == 'test_collection/audio'

    # Verify items
    items = data['items']
    assert isinstance(items, list)
    assert len(items) == 3  # All 3 test files

    # Verify media file item structure
    first_item = items[0]
    assert first_item['type'] == 'media_file'
    assert 'filename' in first_item
    assert 'path' in first_item
    assert 'title' in first_item
    assert 'extension' in first_item
    assert first_item['extension'] == '.mp3'

    # Verify filenames are in items
    filenames = [item['filename'] for item in items]
    assert 'test_track_001.mp3' in filenames
    assert 'test_track_002.mp3' in filenames
    assert 'test_track_003.mp3' in filenames

    # Verify paging
    paging = data['paging']
    assert paging['total_items'] == 3
    assert paging['page'] == 1
    assert paging['has_more'] == False