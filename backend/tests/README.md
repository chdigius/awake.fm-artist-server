# Awake.fm Artist Server Tests

## Running Tests

Tests must be run from the **project root**, not from the `backend/` directory:

```bash
# Run all tests
python -m pytest backend/tests/ -v

# Run specific test file
python -m pytest backend/tests/unit/test_content_graph_from_dict.py -v

# Run specific test
python -m pytest backend/tests/unit/test_content_graph_from_dict.py::TestContentGraphFromDict::test_graph_structure -v
```

## Test Structure

### Base Test Class Pattern

The `ContentGraphTestBase` class provides a reusable test harness for any test that needs access to the content graph fixture.

**Location:** `backend/tests/base.py`

**Usage:**

```python
from backend.tests.base import ContentGraphTestBase

class TestMyFeature(ContentGraphTestBase):
  def test_something(self):
    # Access the loaded ContentGraph
    assert self.graph is not None
    
    # Use helper methods
    nav_config = self.get_nav_config_basic()
```

**What it provides:**
- `self.graph`: ContentGraph loaded from `content_graph_test.json`
- `self.get_nav_config_basic()`: Basic navigation config
- `self.get_nav_config_with_pages()`: Extended navigation config with pages

**Benefits:**
- Fixture loaded once per test class (efficient)
- No need to hardcode test data in every test file
- Easy to extend with more shared utilities
- Clean, maintainable test code

### Directory Structure

```
backend/tests/
├── base.py                    # Base test class
├── resources/
│   └── content_graph_test.json   # Test fixture data
├── unit/                      # Unit tests
│   ├── test_content_graph_from_dict.py
│   └── test_example_base_usage.py
└── functional/                # Functional/integration tests
    └── controllers/
        └── nav_controller_test.py
```

### Test Fixture

The `content_graph_test.json` fixture contains a minimal but realistic content graph with:
- Server node
- Artists collection (ZØL, DISSØLVR)
- ZØL artist with tracks subcollection
- Various content blocks (Hero, Section, Subpage)

This fixture is used across multiple test files via the `ContentGraphTestBase` class.

## Writing New Tests

### Unit Tests (inherit from ContentGraphTestBase)

```python
from backend.tests.base import ContentGraphTestBase
from backend.graph.graph_ops import GraphOps

class TestGraphOps(ContentGraphTestBase):
  def test_nav_generation(self):
    graph_ops = GraphOps.from_graph(
      self.graph, 
      nav_config=self.get_nav_config_basic()
    )
    nav = graph_ops.get_nav()
    assert "items" in nav
```

### Functional Tests (async with test client)

```python
import pytest
import pytest_asyncio
from quart import Quart
from backend.app import create_app
from backend.graph.graph_ops import GraphOps
from backend.tests.base import ContentGraphTestBase

class TestNavController(ContentGraphTestBase):
  @pytest_asyncio.fixture
  async def client(self):
    graph_ops = GraphOps.from_graph(
      self.graph, 
      nav_config=self.get_nav_config_basic()
    )
    app: Quart = create_app(graph_ops)
    app.config.update(TESTING=True)
    
    async with app.test_client() as test_client:
      yield test_client
  
  @pytest.mark.asyncio
  async def test_nav_endpoint(self, client):
    resp = await client.get("/api/nav")
    assert resp.status_code == 200
```

## Notes

- The root `conftest.py` handles Python path setup - don't modify it unless necessary
- Always run tests from project root, not from `backend/` directory
- Test fixture is session-scoped in the base class for efficiency
- Unicode characters in assertions may display differently - test hrefs instead of labels when dealing with special characters

