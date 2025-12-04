# backend/tests/conftest.py
import os
import sys

# Path to the project root (folder that contains "backend/")
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
  sys.path.insert(0, PROJECT_ROOT)
