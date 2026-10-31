import os
import sys
from pathlib import Path

# Add backend directory to sys.path so app imports resolve
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# In Vercel serverless environment, use /tmp/data for writable SQLite and ChromaDB
if os.getenv("VERCEL") and not os.getenv("DATA_DIR"):
    os.environ["DATA_DIR"] = "/tmp/data"

from app.main import app
