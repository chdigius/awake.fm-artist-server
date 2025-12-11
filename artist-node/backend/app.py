# backend/app.py
from pathlib import Path
from quart import Quart, send_from_directory, abort
from backend.graph.graph_ops import GraphOps
from backend.controllers.nav_controller import nav_bp
from backend.controllers.page_controller import page_bp


def create_app(graph_ops: GraphOps, content_root: Path | None = None) -> Quart:
  app = Quart(__name__)
  app.config["GRAPH_OPS"] = graph_ops
  app.config["CONTENT_ROOT"] = content_root or Path("../content").resolve()

  # register controllers
  app.register_blueprint(nav_bp)
  app.register_blueprint(page_bp)

  # Serve static content assets (audio, images, etc.) from the content folder
  @app.route("/content/<path:filepath>")
  async def serve_content_asset(filepath: str):
    """
    Serve static files from the content directory.
    e.g., /content/artists/ishimura/music/tracks/audio/atmos_77.mp3
    """
    content_root = app.config["CONTENT_ROOT"]
    
    # Security: resolve the path and ensure it's within content_root
    requested_path = (content_root / filepath).resolve()
    if not str(requested_path).startswith(str(content_root)):
      abort(403)  # Forbidden - path traversal attempt
    
    if not requested_path.exists() or not requested_path.is_file():
      abort(404)
    
    # Serve the file from its parent directory
    return await send_from_directory(
      requested_path.parent,
      requested_path.name
    )

  # # DEBUG: print routes
  # print("Registered routes:")
  # for rule in app.url_map.iter_rules():
  #   print(" ", rule)

  return app


if __name__ == "__main__":
  import asyncio
  import json
  import yaml
  from pathlib import Path

  from backend.models.content_graph import ContentGraph
  from backend.models.node_config import NodeConfig

  # load node configuration
  node_config = NodeConfig.load(base_dir=Path("."))

  build_dir = Path("build")
  content_graph_path = build_dir / "content_graph.json"

  if content_graph_path.exists():
    with content_graph_path.open("r", encoding="utf-8") as f:
      data = json.load(f)
    graph = ContentGraph.from_dict(data)
  else:
    print(f"Content graph file not found: {content_graph_path}")
    exit(1)

  nav_yaml_path = node_config.nav_path
  if nav_yaml_path.exists():
    with nav_yaml_path.open("r", encoding="utf-8") as f:
      nav_data = yaml.safe_load(f) or {}
  else:
    print(f"Nav YAML file not found: {nav_yaml_path}")
    exit(1)

  graph_ops = GraphOps(graph, nav_config=nav_data)

  # create app
  app = create_app(graph_ops)
  app.run(host="0.0.0.0", port=8888)
