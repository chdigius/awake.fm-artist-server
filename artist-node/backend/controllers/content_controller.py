# backend/controllers/content_controller.py
from pathlib import Path
from quart import Blueprint, current_app, send_from_directory, abort
from quart.views import MethodView

content_bp = Blueprint("content", __name__)


class ContentController(MethodView):
  """Controller for serving static content assets (audio, images, etc.)."""

  async def get(self, filepath: str):
    """
    GET /content/<path:filepath> - Serve static files from the content directory.
    e.g., /content/artists/ishimura/music/tracks/audio/atmos_77.mp3
         /content/assets/backgrounds/starfield_1.jpg
    """
    content_root: Path = current_app.config["CONTENT_ROOT"]
    
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


# Register the view with route parameter
content_bp.add_url_rule(
  "/content/<path:filepath>",
  view_func=ContentController.as_view("content")
)

