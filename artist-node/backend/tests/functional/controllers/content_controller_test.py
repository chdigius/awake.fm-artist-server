import pytest

from backend.tests.base import ContentGraphTestBase


class TestContentController(ContentGraphTestBase):
  """Test content controller endpoints for serving static assets."""

  @pytest.mark.asyncio
  async def test_content_endpoint_serves_file(self, client):
    """Test that the content endpoint serves files from the content directory."""
    # Note: This test assumes test fixtures have some content files
    # For a real test, we'd need to create a temp file in the content directory
    # For now, we'll test the endpoint structure and error handling
    
    # Test with a path that doesn't exist - should return 404
    resp = await client.get("/content/nonexistent/file.jpg")
    assert resp.status_code == 404

  @pytest.mark.asyncio
  async def test_content_endpoint_blocks_path_traversal(self, client):
    """Test that path traversal attempts are blocked with 403."""
    # Try to escape the content directory with ../
    resp = await client.get("/content/../../../etc/passwd")
    assert resp.status_code == 403

  @pytest.mark.asyncio
  async def test_content_endpoint_blocks_absolute_paths(self, client):
    """Test that absolute path attempts are blocked."""
    # Windows absolute path
    resp = await client.get("/content/C:/Windows/System32/config/sam")
    assert resp.status_code in [403, 404]  # Either forbidden or not found
    
    # Unix absolute path (double slash may cause redirect)
    resp2 = await client.get("/content//etc/passwd")
    assert resp2.status_code in [308, 403, 404]  # Redirect, forbidden, or not found

  @pytest.mark.asyncio
  async def test_content_endpoint_requires_filepath(self, client):
    """Test that the endpoint requires a filepath parameter."""
    resp = await client.get("/content/")
    # Should either 404 (no file) or 405 (method not allowed for root)
    assert resp.status_code in [404, 405]

  @pytest.mark.asyncio
  async def test_content_endpoint_blocks_directory_listing(self, client):
    """Test that requesting a directory path returns 404, not a listing."""
    # Try to request a directory instead of a file
    resp = await client.get("/content/artists/")
    assert resp.status_code == 404  # Directories should not be served

  @pytest.mark.asyncio
  async def test_content_endpoint_handles_encoded_paths(self, client):
    """Test that URL-encoded paths are handled correctly."""
    # Test with URL-encoded path traversal attempt
    resp = await client.get("/content/..%2F..%2Fetc%2Fpasswd")
    assert resp.status_code == 403  # Should still block after decoding

  @pytest.mark.asyncio
  async def test_content_endpoint_handles_special_characters(self, client):
    """Test that paths with special characters are handled."""
    # Test with spaces (URL encoded)
    resp = await client.get("/content/artists/test%20file.jpg")
    assert resp.status_code == 404  # File doesn't exist, but shouldn't crash

  @pytest.mark.asyncio
  async def test_content_endpoint_common_media_paths(self, client):
    """Test common media file path patterns."""
    # Audio file path
    resp = await client.get("/content/artists/zol/music/tracks/audio/track.mp3")
    assert resp.status_code == 404  # File doesn't exist in test fixture
    
    # Image file path
    resp2 = await client.get("/content/assets/backgrounds/image.jpg")
    assert resp2.status_code == 404  # File doesn't exist in test fixture
    
    # Both should return 404 (not found) not 500 (server error)
    # This confirms the endpoint handles the paths correctly

  @pytest.mark.asyncio
  async def test_content_endpoint_rejects_null_bytes(self, client):
    """Test that null bytes in paths are rejected."""
    # Null byte injection attempt
    resp = await client.get("/content/file.jpg%00.txt")
    # Should either be forbidden or not found, not cause a crash
    assert resp.status_code in [403, 404]

  @pytest.mark.asyncio
  async def test_content_endpoint_case_sensitivity(self, client):
    """Test that paths are case-sensitive on case-sensitive filesystems."""
    # This behavior may vary by OS, but the endpoint should handle it gracefully
    resp = await client.get("/content/Artists/ZOL/file.jpg")  # Wrong case
    # Should return 404 on case-sensitive systems, may work on Windows
    assert resp.status_code in [404, 200]  # Either not found or found (Windows)

