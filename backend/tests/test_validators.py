from app.utils.validators import (
    extract_youtube_id,
    validate_youtube_url,
    validate_duration,
    sanitize_interval,
    format_timestamp,
)


def test_youtube_id_extraction():
    # Standard URL
    assert extract_youtube_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    # Short URL
    assert extract_youtube_id("https://youtu.be/dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    # Shorts URL
    assert extract_youtube_id("https://www.youtube.com/shorts/3004_d6n_5k") == "3004_d6n_5k"
    # Embed URL
    assert extract_youtube_id("https://www.youtube.com/embed/dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    # Invalid URLs
    assert extract_youtube_id("https://example.com/not-youtube") is None
    assert extract_youtube_id("invalid-text") is None


def test_url_validation():
    valid, vid, err = validate_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert valid is True
    assert vid == "dQw4w9WgXcQ"
    assert err is None

    valid_inv, vid_inv, err_inv = validate_youtube_url("https://vimeo.com/123456")
    assert valid_inv is False
    assert vid_inv is None
    assert "Invalid YouTube URL format" in err_inv


def test_duration_validation():
    # Valid duration (10 mins)
    ok, err = validate_duration(600)
    assert ok is True
    assert err is None

    # Too short (5 seconds)
    ok_short, err_short = validate_duration(5)
    assert ok_short is False
    assert "too short" in err_short

    # Too long (5 hours = 18000 seconds)
    ok_long, err_long = validate_duration(18000)
    assert ok_long is False
    assert "exceeds maximum allowed limit" in err_long


def test_interval_sanitization():
    assert sanitize_interval(15) == 15
    assert sanitize_interval(30) == 30
    assert sanitize_interval(60) == 60
    assert sanitize_interval(120) == 120
    assert sanitize_interval(300) == 300
    # Invalid intervals fall back to default (60)
    assert sanitize_interval(7) == 60
    assert sanitize_interval(None) == 60


def test_timestamp_formatting():
    assert format_timestamp(0) == "00:00"
    assert format_timestamp(65) == "01:05"
    assert format_timestamp(3665) == "01:01:05"


if __name__ == "__main__":
    test_youtube_id_extraction()
    test_url_validation()
    test_duration_validation()
    test_interval_sanitization()
    test_timestamp_formatting()
    print("ALL VALIDATOR TESTS PASSED!")
