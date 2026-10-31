# ==============================================================================
# STAGE 1: Build Frontend (Vite + React)
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==============================================================================
# STAGE 2: Python Backend & Fullstack Container
# ==============================================================================
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies needed for compiling certain packages (e.g., PyMuPDF / Chroma)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ ./

# Copy built frontend from Stage 1
COPY --from=frontend-builder /build/dist ./frontend/dist

# Persistent data directory for SQLite & ChromaDB
ENV DATA_DIR=/app/data
RUN mkdir -p /app/data

# Default port (Render, Railway, Cloud Run override with $PORT)
ENV PORT=8010
EXPOSE 8010

# Launch uvicorn listening on 0.0.0.0:$PORT
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8010}"]
