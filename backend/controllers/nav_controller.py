# backend/controllers/nav_controller.py
from quart import Blueprint, jsonify, current_app
from backend.graph.graph_ops import GraphOps

nav_bp = Blueprint("nav", __name__)

def get_graph_ops() -> GraphOps:
  return current_app.config["GRAPH_OPS"]

@nav_bp.get("/api/nav")
async def get_nav():
  ops = get_graph_ops()
  nav_data = ops.get_nav()
  return jsonify(nav_data)