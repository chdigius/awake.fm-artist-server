from quart import current_app
from quart.views import MethodView
from backend.graph.graph_ops import GraphOps


class ArtistServerControllerBase(MethodView):
  """Base class for all artist server controllers."""

  def get_graph_ops(self) -> GraphOps:
    """Get the GraphOps instance from the current app config."""
    return current_app.config["GRAPH_OPS"]