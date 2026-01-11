# backend/app.py
from pathlib import Path
from quart import Quart
from backend.graph.graph_ops import GraphOps
from backend.controllers.nav_controller import nav_bp
from backend.controllers.page_controller import page_bp
from backend.controllers.content_controller import content_bp
from backend.controllers.collections_controller import collections_bp


def create_app(graph_ops: GraphOps, content_root: Path | None = None) -> Quart:
  app = Quart(__name__)
  app.config["GRAPH_OPS"] = graph_ops
  app.config["CONTENT_ROOT"] = content_root or Path("../content").resolve()

  # register controllers
  app.register_blueprint(nav_bp)
  app.register_blueprint(page_bp)
  app.register_blueprint(content_bp)
  app.register_blueprint(collections_bp)

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
