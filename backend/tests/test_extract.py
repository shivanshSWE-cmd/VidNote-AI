import sys
from pathlib import Path

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ffmpeg_available"] is True
    assert data["ffmpeg_path"] != "Not Found"
    assert "yt_dlp_version" in data


def test_extract_invalid_url():
    response = client.post(
        "/api/extract",
        json={"url": "https://invalid-domain.com/video", "interval_seconds": 60}
    )
    assert response.status_code == 400
    assert "Invalid YouTube URL format" in response.json()["detail"]


def test_extract_invalid_interval():
    # Should automatically fallback interval to 60s
    response = client.post(
        "/api/extract",
        json={"url": "invalid-url", "interval_seconds": 999}
    )
    assert response.status_code == 400


if __name__ == "__main__":
    test_health_endpoint()
    test_extract_invalid_url()
    test_extract_invalid_interval()
    print("ALL API ENDPOINT TESTS PASSED!")
