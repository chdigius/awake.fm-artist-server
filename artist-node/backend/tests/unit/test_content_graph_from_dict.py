from backend.models.node import ContentNode
from backend.models.blocks import HeroBlock, SectionBlock, SubpageBlock
from backend.graph.graph_ops import GraphOps
from backend.tests.base import ContentGraphTestBase


class TestContentGraphFromDict(ContentGraphTestBase):
  """Test ContentGraph deserialization and structure."""
  
  def test_graph_structure(self):
    """Test that the graph has the expected structure and node types."""
    assert self.graph is not None
    assert self.graph.root_content_path == "server"

    # Assert all nodes exist as expected
    server_node = self.graph.get_node("server")
    artists_node = self.graph.get_node("artists")
    zol_node = self.graph.get_node("artists/zol")
    zol_tracks_node = self.graph.get_node("artists/zol/tracks")

    # All nodes should exist and be of type ContentNode
    for node in (server_node, artists_node, zol_node, zol_tracks_node):
      assert isinstance(node, ContentNode)

    # Quick meta checks
    assert server_node.meta.layout == "server"
    assert artists_node.meta.layout == "artists"
    assert zol_node.meta.layout == "artist"
    assert zol_tracks_node.meta.layout == "tracks"

  def test_content_blocks(self):
    """Test that content blocks are properly deserialized."""
    server_node = self.graph.get_node("server")
    artists_node = self.graph.get_node("artists")
    zol_node = self.graph.get_node("artists/zol")

    # Server node content structure
    assert isinstance(server_node.content, list)
    assert len(server_node.content) == 4
    assert isinstance(server_node.content[0], HeroBlock)
    assert isinstance(server_node.content[1], SectionBlock)
    assert isinstance(server_node.content[1].blocks[0], SubpageBlock)

    # Artists node content structure
    assert isinstance(artists_node.content, list)
    assert isinstance(artists_node.content[0], SectionBlock)
    assert len(artists_node.content[0].blocks) == 2
    assert isinstance(artists_node.content[0].blocks[0], SubpageBlock)
    assert isinstance(artists_node.content[0].blocks[1], SubpageBlock)

    # Zol node content structure
    assert isinstance(zol_node.content, list)
    assert isinstance(zol_node.content[0], SectionBlock)
    assert len(zol_node.content[0].blocks) == 1
    assert isinstance(zol_node.content[0].blocks[0], SubpageBlock)

  def test_graph_ops_navigation(self):
    """Test that GraphOps produces correct navigation from the graph."""
    nav_config = self.get_nav_config_basic()
    graph_ops = GraphOps.from_graph(self.graph, nav_config=nav_config)
    nav = graph_ops.get_nav()

    assert "items" in nav
    items = nav["items"]
    assert isinstance(items, list)
    assert len(items) == 4

    assert items[0]["label"] == "Home"
    assert items[0]["href"] == "/"

    assert items[1]["label"] == "Artists"
    assert items[1]["href"] == "/artists"
    assert items[1]["children"] is not None
    assert len(items[1]["children"]) == 2

    assert items[1]["children"][0]["href"] == "/artists/zol"
    assert items[1]["children"][1]["href"] == "/artists/dissolvr"

    # Check that both artists are present (Unicode display names may vary by terminal)
    child_labels = [child["label"] for child in items[1]["children"]]
    assert len(child_labels) == 2
    assert "zol" in items[1]["children"][0]["href"]
    assert "dissolvr" in items[1]["children"][1]["href"]

    assert items[2]["label"] == "Releases"
    assert items[2]["href"] == "/server/pages/releases"

    assert items[3]["label"] == "Store"
    assert items[3]["href"] == "/server/pages/store"
