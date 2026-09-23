# Multi-stage optimized Python runtime for FastAPI Backend
FROM python:3.12-slim as base

# Set Environment Variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies (FFmpeg, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies file
COPY requirements.txt .

# Install dependencies into system site-packages
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create static frames directory & setup non-root execution
RUN mkdir -p static/frames && \
    useradd -m -u 10001 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
