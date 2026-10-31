@echo off
title JohnGPT Starter
echo Starting JohnGPT Backend on http://127.0.0.1:8010 ...
start "JohnGPT Backend" cmd /k "cd /d c:\Users\varad\mollie\backend && .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload"

echo Starting JohnGPT Frontend on http://localhost:5173 ...
start "JohnGPT Frontend" cmd /k "cd /d c:\Users\varad\mollie\frontend && npm run dev"

echo Both JohnGPT services launched successfully!

