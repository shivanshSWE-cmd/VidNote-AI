import sys
from pathlib import Path

# Add app package directory to Python path if needed
base_dir = Path(__file__).resolve().parent
if str(base_dir) not in sys.path:
    sys.path.insert(0, str(base_dir))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
