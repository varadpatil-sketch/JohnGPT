# JohnGPT Deployment Guide

This repository contains the complete full-stack **JohnGPT** application (React frontend + FastAPI backend + Conversational RAG + SQLite + ChromaDB).

The app is containerized using a multi-stage `Dockerfile` where FastAPI directly serves both the API endpoints and the production React frontend build on a single port.

---

## Prerequisites
- A Google Gemini API Key ([Get one from Google AI Studio](https://aistudio.google.com/))
- A free account on [Render](https://render.com/) or [Railway](https://railway.app/)
- A GitHub repository (public or private)

---

## Option 1: Deploy on Render (Recommended)

### Step 1: Push Code to GitHub
1. Initialize git and commit your files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for JohnGPT deployment"
   ```
2. Create a new repository on GitHub (e.g., `johngpt`).
3. Link and push your repository:
   ```bash
   git remote add origin https://github.com/<your-username>/johngpt.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository `johngpt`.
4. Choose **Docker** as the Runtime (it will automatically detect the `Dockerfile`).
5. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: `<Your-Google-Gemini-API-Key>`
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite` (or your preferred model)
   - `DATA_DIR`: `/app/data`
6. (Optional for data persistence across restarts): Under **Disks**, add a Persistent Disk mounted at `/app/data` (e.g. 1 GB).
7. Click **Create Web Service**.
8. Once built (usually 2-3 minutes), your app will be live at `https://johngpt.onrender.com`!

---

## Option 2: Deploy on Railway

1. Log in to [Railway](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your `johngpt` repository.
4. Railway will automatically detect the `Dockerfile` and build both the React frontend and FastAPI backend.
5. In your project settings, click **Variables** and add:
   - `GEMINI_API_KEY`: `<Your-Google-Gemini-API-Key>`
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
6. In **Settings** > **Networking**, click **Generate Domain** to get a public `*.up.railway.app` URL.
7. (Optional for data persistence): Click **New** > **Volume** and mount it to `/app/data`.

---

## Option 3: Run with Docker Locally or on Any VPS

You can build and run the production container locally or on any server with Docker installed:

```bash
# Build the production container
docker build -t johngpt .

# Run the container with your Gemini API key
docker run -d -p 8010:8010 \
  -e GEMINI_API_KEY="your-gemini-api-key" \
  -v "$(pwd)/data:/app/data" \
  --name johngpt johngpt
```

Open [http://localhost:8010](http://localhost:8010) in your browser.

