from quart import request, Blueprint, jsonify

from backend.controllers.base import ArtistServerControllerBase

collections_bp = Blueprint("collections", __name__)


class CollectionsController(ArtistServerControllerBase):
  """Controller for collection endpoints."""

  async def get(self):
    """
    GET /api/collection

    Query params (v1):
      - source: folder|roster|tag|query|media_folder   (default: folder)
      - path: required (e.g. "artists" or "music/sets/audio/bassdrive")
      - pattern: optional file pattern for media_folder (e.g. "*.mp3")
      - page: int (default: 1)
      - page_size: int (default: 24)
      - sort: optional (e.g. "name_asc", "random")
      - limit: optional hard cap (int)
      - card: optional (e.g. "artist")
      - mode: optional layout mode hint (grid|list|carousel)
    """
    source = request.args.get("source", "folder")
    path = request.args.get("path")
    if not path:
      return jsonify({"error": "Missing required query param: path"}), 400

    # paging
    try:
      page = int(request.args.get("page", "1"))
    except ValueError:
      page = 1

    try:
      page_size = int(request.args.get("page_size", "24"))
    except ValueError:
      page_size = 24

    # shaping
    sort = request.args.get("sort")
    card = request.args.get("card")
    pattern = request.args.get("pattern")

    limit = None
    limit_raw = request.args.get("limit")
    if limit_raw is not None:
      try:
        limit = int(limit_raw)
      except ValueError:
        limit = None

    # layout hint (optional)
    mode = request.args.get("mode")  # grid|list|carousel
    layout = {"mode": mode} if mode else None

    payload = self.get_graph_ops().get_collection(
      source=source,
      path=path,
      pattern=pattern,
      page=page,
      page_size=page_size,
      sort=sort,
      limit=limit,
      card=card,
      layout=layout,
    )

    if payload is None:
      return jsonify({"error": "Not found"}), 404

    return jsonify(payload)


# Register the view
collections_bp.add_url_rule(
  "/api/collection",
  view_func=CollectionsController.as_view("collection")
)
