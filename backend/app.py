# backend/app.py
from quart import Quart
from backend.graph.graph_ops import GraphOps
from backend.controllers.nav_controller import nav_bp


def create_app(graph_ops: GraphOps) -> Quart:
  app = Quart(__name__)
  app.config["GRAPH_OPS"] = graph_ops

  # register controllers
  app.register_blueprint(nav_bp)

  return app