import re
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


class FindTrackController(ArtistServerControllerBase):
  """Controller for finding a track's page number in a collection."""

  async def get(self):
    """
    GET /api/collection/find-track

    Query params:
      - track_id: required (filename without extension, URL-safe)
      - source: folder|roster|tag|query|media_folder (default: media_folder)
      - path: required (e.g. "artists/awake_fm_legacy/music/sets/audio/bassdrive")
      - pattern: optional file pattern for media_folder (e.g. "*.mp3")
      - page_size: int (default: 10)

    Returns:
      - found: bool
      - page: int (1-indexed page number where track is located)
      - index: int (0-indexed position in full collection)
      - total_items: int
    """
    track_id = request.args.get("track_id")
    if not track_id:
      return jsonify({"error": "Missing required query param: track_id"}), 400

    source = request.args.get("source", "media_folder")
    path = request.args.get("path")
    if not path:
      return jsonify({"error": "Missing required query param: path"}), 400

    pattern = request.args.get("pattern")

    try:
      page_size = int(request.args.get("page_size", "10"))
    except ValueError:
      page_size = 10

    # Get ALL items from collection (no pagination)
    payload = self.get_graph_ops().get_collection(
      source=source,
      path=path,
      pattern=pattern,
      page=1,
      page_size=999999,  # Get all items
      sort=None,
      limit=None,
      card=None,
      layout=None,
    )

    if payload is None or not payload.get("items"):
      return jsonify({"found": False, "error": "Collection not found or empty"}), 404

    items = payload["items"]

    # Search for track by matching filename (with or without extension)
    for index, item in enumerate(items):
      if item.get("type") == "media_file":
        filename = item.get("filename", "")

        # Generate URL-safe ID from filename (same logic as frontend)
        item_id = filename.replace(item.get("extension", ""), "")  # Remove extension
        item_id = re.sub(r'[^a-zA-Z0-9-_]', '-', item_id)  # Replace non-alphanumeric with dash
        item_id = re.sub(r'-+', '-', item_id)  # Collapse multiple dashes
        item_id = item_id.strip('-')  # Remove leading/trailing dashes

        # Debug logging
        print(f"[FindTrack] Comparing: '{item_id}' vs '{track_id}'")

        if item_id == track_id:
          # Calculate page number (1-indexed)
          page = (index // page_size) + 1
          return jsonify({
            "found": True,
            "page": page,
            "index": index,
            "total_items": len(items),
            "filename": filename,
            "item_id": item_id,
          })

    return jsonify({"found": False, "total_items": len(items)})


# Register the views
collections_bp.add_url_rule(
  "/api/collection",
  view_func=CollectionsController.as_view("collection")
)

collections_bp.add_url_rule(
  "/api/collection/find-track",
  view_func=FindTrackController.as_view("find_track")
)
