# JohnGPT Deployment Guide

This repository contains the complete full-stack **JohnGPT** application (React frontend + FastAPI backend + Conversational RAG + SQLite + ChromaDB).

Both frontend and backend are fully pre-configured to deploy together directly on **Vercel** as well as **Render**, **Railway**, or with **Docker**.

---

## Option 1: Deploy on Vercel (Frontend + Backend in One Project)

This repository includes a native Vercel configuration (`vercel.json` + `api/index.py`):
- **Frontend**: Vite SPA built and served from CDN edge.
- **Backend**: FastAPI running via Vercel Python Serverless Function (`api/index.py`) on Fluid Compute with streaming support.

### Step-by-Step Vercel Deployment:

1. **Go to Vercel**:
   - Open [vercel.com/new](https://vercel.com/new) and log in with your GitHub account.

2. **Import Repository**:
   - Select your repository: **`varadpatil-sketch/JohnGPT`** and click **Import**.

3. **Configure Project**:
   - **Project Name**: `johngpt` (or any name you like).
   - **Root Directory**: Leave it as `./` (default root folder). **Do NOT** change it to `frontend` so both backend and frontend build together!
   - **Framework Preset**: Auto-detected / Other.

4. **Add Environment Variables**:
   Expand the **Environment Variables** section and add:
   - `GEMINI_API_KEY`: `<Your-Google-Gemini-API-Key>`
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite` (optional, default)

5. **Deploy**:
   - Click **Deploy**.
   - Vercel will install Python dependencies, build the React frontend, and deploy the entire application to a live URL (e.g. `https://johngpt.vercel.app`)!

6. **Change URL / Custom Domain** (Optional):
   - In your Vercel Dashboard, go to **Settings** > **Domains**.
   - Edit the `.vercel.app` subdomain or attach your own custom domain.

---

## Option 2: Deploy on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository `JohnGPT`.
4. Choose **Docker** as the Runtime (it will automatically detect the `Dockerfile`).
5. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: `<Your-Google-Gemini-API-Key>`
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
   - `DATA_DIR`: `/app/data`
6. (Optional for data persistence across restarts): Under **Disks**, add a Persistent Disk mounted at `/app/data` (e.g. 1 GB).
7. Click **Create Web Service**.
8. Once built (usually 2-3 minutes), your app will be live at `https://johngpt.onrender.com`!

---

## Option 3: Deploy on Railway

1. Log in to [Railway](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your `JohnGPT` repository.
4. Railway will automatically detect the `Dockerfile` and build both the React frontend and FastAPI backend.
5. In your project settings, click **Variables** and add:
   - `GEMINI_API_KEY`: `<Your-Google-Gemini-API-Key>`
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
6. In **Settings** > **Networking**, click **Generate Domain** to get a public `*.up.railway.app` URL.
7. (Optional for data persistence): Click **New** > **Volume** and mount it to `/app/data`.

---

## Option 4: Run with Docker Locally or on Any VPS

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
