from quart import request, Blueprint, jsonify

from backend.controllers.base import ArtistServerControllerBase

page_bp = Blueprint("page", __name__)


class PageController(ArtistServerControllerBase):
  """Controller for page content endpoints. (TODO: implement)"""

  async def get(self):
    """GET /api/page - Returns page content."""
    path = request.args.get("path")  # e.g. "artists/zol"
    payload = self.get_graph_ops().get_page(path)

    if payload is None:
      return jsonify({"error": "Not found"}), 404

    return jsonify(payload)


# Register the view
page_bp.add_url_rule("/api/page", view_func=PageController.as_view("page"))