# backend/controllers/nav_controller.py
from quart import Blueprint, jsonify

from backend.controllers.base import ArtistServerControllerBase

nav_bp = Blueprint("nav", __name__)


class NavController(ArtistServerControllerBase):
  """Controller for navigation endpoints."""

  async def get(self):
    """GET /api/nav - Returns navigation structure."""
    ops = self.get_graph_ops()
    nav_data = ops.get_nav()
    return jsonify(nav_data)

# Register the view
nav_bp.add_url_rule("/api/nav", view_func=NavController.as_view("nav"))