import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  Code,
  Monitor,
  FileText,
  GitBranch,
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink,
  X,
  Sparkles,
  ChevronDown,
  Trash2,
  Plus,
  Mic,
  MicOff,
  Globe,
  Smartphone,
  Gamepad2,
  BarChart3,
  ChevronRight,
  Sliders,
  Atom,
  Presentation,
  Palette,
  SlidersHorizontal,
  ArrowLeft,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { createSpeechRecognizer, isSpeechRecognitionSupported } from "../utils/voice";

// ============================================================================
// STARTER ARTIFACTS (Interactive Real-Time Templates for Skills)
// ============================================================================

const STARTER_POMODORO = {
  id: "starter-pomodoro",
  title: "Neon Focus Pomodoro",
  type: "app",
  language: "html",
  createdAt: Date.now(),
  code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Pomodoro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0d14;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: rgba(18, 23, 38, 0.95);
      border: 1.5px solid rgba(168, 85, 247, 0.5);
      border-radius: 24px;
      padding: 36px 32px;
      width: 100%;
      max-width: 380px;
      text-align: center;
      box-shadow: 0 0 30px rgba(168, 85, 247, 0.3), 0 0 60px rgba(99, 102, 241, 0.2);
    }
    h1 {
      font-size: 1.6rem;
      background: linear-gradient(135deg, #ffffff, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .mode-pill {
      display: inline-block;
      font-size: 0.8rem;
      color: #c084fc;
      background: rgba(168, 85, 247, 0.15);
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid rgba(168, 85, 247, 0.3);
      margin-bottom: 24px;
    }
    .timer-display {
      font-size: 4.2rem;
      font-weight: 700;
      letter-spacing: -2px;
      color: #ffffff;
      text-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
      margin: 16px 0 28px 0;
      font-variant-numeric: tabular-nums;
    }
    .controls {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    button {
      padding: 12px 24px;
      border-radius: 12px;
      border: none;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
      color: white;
      box-shadow: 0 0 16px rgba(168, 85, 247, 0.5);
    }
    .btn-primary:hover {
      box-shadow: 0 0 24px rgba(168, 85, 247, 0.8);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }
    .stats {
      margin-top: 24px;
      font-size: 0.85rem;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Focus Studio</h1>
    <div class="mode-pill" id="mode-text">Pomodoro Session</div>
    <div class="timer-display" id="time">25:00</div>
    <div class="controls">
      <button class="btn-primary" id="start-btn" onclick="toggleTimer()">Start</button>
      <button class="btn-secondary" onclick="resetTimer()">Reset</button>
    </div>
    <div class="stats" id="stats">Completed: 0 sessions</div>
  </div>

  <script>
    let timeLeft = 25 * 60;
    let isRunning = false;
    let timerId = null;
    let sessions = 0;

    function updateDisplay() {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      document.getElementById('time').innerText = 
        String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    function toggleTimer() {
      const btn = document.getElementById('start-btn');
      if (isRunning) {
        clearInterval(timerId);
        isRunning = false;
        btn.innerText = 'Start';
      } else {
        isRunning = true;
        btn.innerText = 'Pause';
        timerId = setInterval(() => {
          if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
          } else {
            clearInterval(timerId);
            isRunning = false;
            sessions++;
            document.getElementById('stats').innerText = 'Completed: ' + sessions + ' sessions';
            alert('🎉 Session complete! Take a well-deserved break.');
            resetTimer();
          }
        }, 1000);
      }
    }

    function resetTimer() {
      clearInterval(timerId);
      isRunning = false;
      timeLeft = 25 * 60;
      document.getElementById('start-btn').innerText = 'Start';
      updateDisplay();
    }

    updateDisplay();
  </script>
</body>
</html>`,
};

const STARTER_WEBSITE = {
  id: "starter-website",
  title: "Aetheria Cyber Landing",
  type: "website",
  language: "html",
  createdAt: Date.now(),
  code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aetheria AI Studio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0d14;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow-x: hidden;
      line-height: 1.6;
    }
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 40px;
      background: rgba(15, 20, 34, 0.8);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(168, 85, 247, 0.25);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .logo {
      font-size: 1.3rem;
      font-weight: 800;
      background: linear-gradient(135deg, #ffffff, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-links { display: flex; gap: 24px; list-style: none; }
    .nav-links a { color: #94a3b8; text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
    .nav-links a:hover { color: #c084fc; }
    .btn-glow {
      padding: 10px 22px;
      border-radius: 10px;
      background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
      color: white;
      font-weight: 600;
      border: none;
      cursor: pointer;
      box-shadow: 0 0 16px rgba(168, 85, 247, 0.5);
      transition: all 0.2s;
    }
    .btn-glow:hover { transform: translateY(-1px); box-shadow: 0 0 24px rgba(168, 85, 247, 0.8); }
    .hero {
      text-align: center;
      padding: 80px 20px 60px;
      max-width: 900px;
      margin: 0 auto;
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      background: rgba(168, 85, 247, 0.15);
      border: 1px solid rgba(168, 85, 247, 0.4);
      color: #c084fc;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 3.2rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #ffffff 40%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p { font-size: 1.15rem; color: #94a3b8; margin-bottom: 36px; }
    .calculator-card {
      background: rgba(18, 23, 38, 0.85);
      border: 1.5px solid rgba(168, 85, 247, 0.4);
      border-radius: 20px;
      padding: 32px;
      max-width: 600px;
      margin: 40px auto 0;
      box-shadow: 0 0 35px rgba(168, 85, 247, 0.2);
    }
    .calc-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; color: #f8fafc; }
    .slider-row { margin: 20px 0; }
    .slider-label { display: flex; justify-content: space-between; font-size: 0.9rem; color: #cbd5e1; margin-bottom: 8px; }
    input[type=range] { width: 100%; accent-color: #a855f7; }
    .calc-result {
      font-size: 2.2rem;
      font-weight: 800;
      color: #c084fc;
      margin-top: 16px;
      text-shadow: 0 0 15px rgba(168, 85, 247, 0.6);
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      max-width: 1100px;
      margin: 60px auto;
      padding: 0 20px;
    }
    .feature-card {
      background: rgba(18, 23, 38, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.25s;
    }
    .feature-card:hover {
      border-color: rgba(168, 85, 247, 0.5);
      transform: translateY(-3px);
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.25);
    }
    .feature-card h3 { color: #ffffff; font-size: 1.1rem; margin-bottom: 8px; }
    .feature-card p { color: #94a3b8; font-size: 0.88rem; }
  </style>
</head>
<body>
  <nav>
    <div class="logo">⚡ Aetheria</div>
    <ul class="nav-links">
      <li><a href="#features">Features</a></li>
      <li><a href="#calculator">ROI Calculator</a></li>
      <li><a href="#about">About</a></li>
    </ul>
    <button class="btn-glow" onclick="alert('Welcome to Aetheria Studio!')">Get Started</button>
  </nav>

  <section class="hero">
    <div class="badge">✦ Live Interactive Website</div>
    <h1>Build The Next Generation of Web Apps</h1>
    <p>Ultra-fast, beautifully designed, and powered by neon intelligence.</p>

    <div class="calculator-card" id="calculator">
      <div class="calc-title">Interactive Value Estimator</div>
      <div class="slider-row">
        <div class="slider-label">
          <span>Active Monthly Users:</span>
          <span id="user-count">50,000</span>
        </div>
        <input type="range" id="user-slider" min="5000" max="250000" step="5000" value="50000" oninput="updateCalc()">
      </div>
      <div class="slider-row">
        <div class="slider-label">
          <span>Speed Optimization:</span>
          <span id="speed-pct">80%</span>
        </div>
        <input type="range" id="speed-slider" min="20" max="100" step="5" value="80" oninput="updateCalc()">
      </div>
      <div style="font-size: 0.85rem; color: #94a3b8;">Estimated Annual Production Impact:</div>
      <div class="calc-result" id="annual-savings">$144,000 / yr</div>
    </div>
  </section>

  <div class="features-grid" id="features">
    <div class="feature-card">
      <h3>🚀 Instant Sandbox</h3>
      <p>Zero-configuration live web previews rendered directly in real-time with isolated security.</p>
    </div>
    <div class="feature-card">
      <h3>🎨 Neon Design Tokens</h3>
      <p>Precision-tailored color scales, glassmorphism filters, and smooth micro-interactions.</p>
    </div>
    <div class="feature-card">
      <h3>⚡ State Management</h3>
      <p>Full reactive data binding and local storage sync for continuous production reliability.</p>
    </div>
  </div>

  <script>
    function updateCalc() {
      const users = parseInt(document.getElementById('user-slider').value);
      const speed = parseInt(document.getElementById('speed-slider').value);
      document.getElementById('user-count').innerText = users.toLocaleString();
      document.getElementById('speed-pct').innerText = speed + '%';
      const savings = Math.round((users * 2.4) * (speed / 100) * 1.5);
      document.getElementById('annual-savings').innerText = '$' + savings.toLocaleString() + ' / yr';
    }
    updateCalc();
  </script>
</body>
</html>`,
};

const STARTER_GAME = {
  id: "starter-game",
  title: "Neon CyberPulse Arcade",
  type: "game",
  language: "html",
  createdAt: Date.now(),
  code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon CyberPulse Arcade</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background: #060911;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    #game-container {
      position: relative;
      border: 2px solid rgba(168, 85, 247, 0.6);
      border-radius: 16px;
      box-shadow: 0 0 35px rgba(168, 85, 247, 0.4), 0 0 70px rgba(99, 102, 241, 0.2);
      overflow: hidden;
      background: #0a0d14;
    }
    canvas { display: block; }
    .hud {
      position: absolute;
      top: 14px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 0.95rem;
      font-weight: 700;
      color: #c084fc;
      text-shadow: 0 0 10px rgba(168, 85, 247, 0.8);
      pointer-events: none;
    }
    .hud span { background: rgba(18, 23, 38, 0.7); padding: 4px 12px; border-radius: 9999px; border: 1px solid rgba(168, 85, 247, 0.3); }
    .controls-hint {
      margin-top: 14px;
      font-size: 0.85rem;
      color: #94a3b8;
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .key-badge {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      border-radius: 6px;
      color: #fff;
      font-weight: 600;
    }
    .btn-game {
      background: linear-gradient(135deg, #a855f7, #6366f1);
      border: none;
      color: white;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 0 12px rgba(168, 85, 247, 0.5);
    }
  </style>
</head>
<body>
  <div id="game-container">
    <div class="hud">
      <span id="score-display">Score: 0</span>
      <span id="shield-display">Shield: 100%</span>
      <span id="wave-display">Wave: 1</span>
    </div>
    <canvas id="gameCanvas" width="600" height="420"></canvas>
  </div>
  <div class="controls-hint">
    <span>Controls: <span class="key-badge">←</span> <span class="key-badge">→</span> or Mouse to Move</span>
    <span><span class="key-badge">Space</span> or Click to Fire</span>
    <button class="btn-game" onclick="restartGame()">Restart</button>
  </div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let audioCtx = null;
    function playLaserSound() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } catch(e) {}
    }

    function playExplodeSound() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch(e) {}
    }

    let player = { x: 300, y: 380, width: 26, height: 26, speed: 7, shield: 100 };
    let bullets = [];
    let enemies = [];
    let particles = [];
    let stars = [];
    let score = 0;
    let wave = 1;
    let keys = {};
    let gameOver = false;

    for (let i = 0; i < 70; i++) {
      stars.push({ x: Math.random() * 600, y: Math.random() * 420, speed: Math.random() * 1.5 + 0.5, size: Math.random() * 2 });
    }

    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      if (e.key === ' ' && !gameOver) {
        shootBullet();
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => { keys[e.key] = false; });

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      player.x = Math.max(20, Math.min(580, e.clientX - rect.left));
    });

    canvas.addEventListener('mousedown', () => {
      if (!gameOver) shootBullet();
    });

    function shootBullet() {
      bullets.push({ x: player.x, y: player.y - 14, speed: 10, radius: 3 });
      playLaserSound();
    }

    function spawnEnemy() {
      if (enemies.length < 5 + wave * 2) {
        enemies.push({
          x: Math.random() * 540 + 30,
          y: -20,
          speed: Math.random() * 1.8 + 1 + wave * 0.2,
          radius: Math.random() * 8 + 14,
          hp: Math.ceil(wave / 2),
          color: Math.random() > 0.5 ? '#a855f7' : '#06b6d4'
        });
      }
    }

    function createExplosion(x, y, color) {
      for (let i = 0; i < 14; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1,
          color
        });
      }
      playExplodeSound();
    }

    function restartGame() {
      player = { x: 300, y: 380, width: 26, height: 26, speed: 7, shield: 100 };
      bullets = [];
      enemies = [];
      particles = [];
      score = 0;
      wave = 1;
      gameOver = false;
      document.getElementById('shield-display').innerText = 'Shield: 100%';
      document.getElementById('score-display').innerText = 'Score: 0';
      document.getElementById('wave-display').innerText = 'Wave: 1';
    }

    let enemyTimer = 0;
    function update() {
      if (gameOver) return;

      if (keys['ArrowLeft'] || keys['a']) player.x = Math.max(20, player.x - player.speed);
      if (keys['ArrowRight'] || keys['d']) player.x = Math.min(580, player.x + player.speed);

      stars.forEach(s => {
        s.y += s.speed;
        if (s.y > 420) s.y = 0;
      });

      bullets.forEach((b, i) => {
        b.y -= b.speed;
        if (b.y < -10) bullets.splice(i, 1);
      });

      enemyTimer++;
      if (enemyTimer % 40 === 0) spawnEnemy();

      enemies.forEach((en, eIdx) => {
        en.y += en.speed;
        bullets.forEach((b, bIdx) => {
          const dist = Math.hypot(en.x - b.x, en.y - b.y);
          if (dist < en.radius + b.radius) {
            bullets.splice(bIdx, 1);
            en.hp--;
            if (en.hp <= 0) {
              createExplosion(en.x, en.y, en.color);
              enemies.splice(eIdx, 1);
              score += 100;
              document.getElementById('score-display').innerText = 'Score: ' + score;
              if (score % 600 === 0) {
                wave++;
                document.getElementById('wave-display').innerText = 'Wave: ' + wave;
              }
            }
          }
        });

        if (Math.hypot(en.x - player.x, en.y - player.y) < en.radius + 14) {
          createExplosion(en.x, en.y, '#ef4444');
          enemies.splice(eIdx, 1);
          player.shield = Math.max(0, player.shield - 25);
          document.getElementById('shield-display').innerText = 'Shield: ' + player.shield + '%';
          if (player.shield <= 0) {
            gameOver = true;
          }
        }

        if (en.y > 440) enemies.splice(eIdx, 1);
      });

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.035;
        if (p.life <= 0) particles.splice(i, 1);
      });
    }

    function render() {
      ctx.clearRect(0, 0, 600, 420);

      ctx.fillStyle = '#64748b';
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(14, 14);
      ctx.lineTo(0, 8);
      ctx.lineTo(-14, 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#38bdf8';
      bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      enemies.forEach(en => {
        ctx.save();
        ctx.shadowColor = en.color;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = en.color;
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(18, 23, 38, 0.8)';
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (gameOver) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 13, 20, 0.85)';
        ctx.fillRect(0, 0, 600, 420);
        ctx.fillStyle = '#f87171';
        ctx.font = '700 28px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
        ctx.fillText('MISSION FAILED', 300, 200);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 16px -apple-system, sans-serif';
        ctx.shadowBlur = 0;
        ctx.fillText('Final Score: ' + score + ' • Click Restart to retry', 300, 235);
        ctx.restore();
      }

      requestAnimationFrame(() => {
        update();
        render();
      });
    }

    render();
  </script>
</body>
</html>`,
};

const STARTER_3D = {
  id: "starter-3d",
  title: "Interactive 3D Neon Universe",
  type: "3d",
  language: "html",
  createdAt: Date.now(),
  code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Three.js Neon Particle Core</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #060911;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    #canvas-container { width: 100%; height: 100%; }
    .overlay-ui {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(18, 23, 38, 0.85);
      border: 1.5px solid rgba(168, 85, 247, 0.4);
      padding: 16px 20px;
      border-radius: 14px;
      backdrop-filter: blur(12px);
      box-shadow: 0 0 25px rgba(168, 85, 247, 0.3);
      z-index: 10;
      max-width: 280px;
    }
    h2 { font-size: 1rem; color: #fff; margin-bottom: 6px; }
    p { font-size: 0.8rem; color: #94a3b8; margin-bottom: 12px; }
    .ctrl-group { display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; }
    .slider-row { display: flex; justify-content: space-between; align-items: center; }
    input[type=range] { accent-color: #a855f7; width: 110px; }
    .color-btns { display: flex; gap: 8px; margin-top: 6px; }
    .c-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .c-btn:hover { transform: scale(1.15); }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <div class="overlay-ui">
    <h2>✦ Neon 3D Universe</h2>
    <p>Drag mouse or swipe to rotate camera in 3D orbit.</p>
    <div class="ctrl-group">
      <div class="slider-row">
        <span>Rotation Speed:</span>
        <input type="range" id="speed" min="1" max="25" value="10">
      </div>
      <span>Palette:</span>
      <div class="color-btns">
        <div class="c-btn" style="background: #a855f7;" onclick="setTheme(0xa855f7, 0x38bdf8)"></div>
        <div class="c-btn" style="background: #06b6d4;" onclick="setTheme(0x06b6d4, 0x10b981)"></div>
        <div class="c-btn" style="background: #ec4899;" onclick="setTheme(0xec4899, 0xf59e0b)"></div>
      </div>
    </div>
  </div>

  <div id="canvas-container"></div>

  <script>
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060911, 0.002);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 250;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const geo = new THREE.DodecahedronGeometry(50, 1);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.85 });
    const core = new THREE.Mesh(geo, wireMat);
    scene.add(core);

    const innerGeo = new THREE.IcosahedronGeometry(28, 2);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.45 });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    const particleCount = 1400;
    const pGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 600;
      positions[i + 1] = (Math.random() - 0.5) * 600;
      positions[i + 2] = (Math.random() - 0.5) * 600;
    }
    pGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMaterial = new THREE.PointsMaterial({ color: 0xc084fc, size: 2.5, transparent: true, opacity: 0.75 });
    const particles = new THREE.Points(pGeometry, pMaterial);
    scene.add(particles);

    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let isDragging = false;
    let prevMouseX = 0, prevMouseY = 0;

    window.addEventListener('mousedown', e => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      targetX += dx * 0.005;
      targetY += dy * 0.005;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    function setTheme(c1, c2) {
      wireMat.color.setHex(c1);
      innerMat.color.setHex(c2);
      pMaterial.color.setHex(c1);
    }

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
      requestAnimationFrame(animate);
      const speed = parseFloat(document.getElementById('speed').value) * 0.001;
      core.rotation.x += speed;
      core.rotation.y += speed * 1.3;
      innerMesh.rotation.x -= speed * 1.5;
      innerMesh.rotation.y += speed;
      particles.rotation.y += speed * 0.3;

      scene.rotation.y += (targetX - scene.rotation.y) * 0.05;
      scene.rotation.x += (targetY - scene.rotation.x) * 0.05;

      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`,
};

const STARTER_DASHBOARD = {
  id: "starter-dashboard",
  title: "Nexus Real-Time Metrics",
  type: "dashboard",
  language: "html",
  createdAt: Date.now(),
  code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus Pulse Analytics</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0d14;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(168, 85, 247, 0.25);
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #fff, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #4ade80;
      background: rgba(74, 222, 128, 0.1);
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid rgba(74, 222, 128, 0.3);
    }
    .pulse-dot { width: 7px; height: 7px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 8px #4ade80; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: rgba(18, 23, 38, 0.8);
      border: 1.5px solid rgba(168, 85, 247, 0.35);
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.15);
    }
    .kpi-label { font-size: 0.82rem; color: #94a3b8; margin-bottom: 6px; }
    .kpi-val { font-size: 1.8rem; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .kpi-diff { font-size: 0.78rem; color: #4ade80; }
    .chart-panel {
      background: rgba(18, 23, 38, 0.8);
      border: 1.5px solid rgba(168, 85, 247, 0.35);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 0 25px rgba(168, 85, 247, 0.18);
    }
    .chart-title { font-size: 1rem; font-weight: 600; margin-bottom: 16px; color: #cbd5e1; }
    svg { width: 100%; height: 180px; overflow: visible; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Nexus Pulse Live Metrics</h1>
    <div class="status-badge">
      <div class="pulse-dot"></div>
      <span>Engine Operational • 99.98% SLA</span>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">API Requests / sec</div>
      <div class="kpi-val" id="rps">14,289</div>
      <div class="kpi-diff">↑ +14.2% vs baseline</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">P99 Latency</div>
      <div class="kpi-val" id="lat">18.4ms</div>
      <div class="kpi-diff">↓ -3.1ms optimal</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Active Sandboxes</div>
      <div class="kpi-val" id="boxes">1,402</div>
      <div class="kpi-diff">↑ +88 in 10 mins</div>
    </div>
  </div>

  <div class="chart-panel">
    <div class="chart-title">Real-time Throughput (Past 60 Seconds)</div>
    <svg viewBox="0 0 600 180">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#a855f7" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#a855f7" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path id="area" fill="url(#grad)" d=""/>
      <path id="line" fill="none" stroke="#c084fc" stroke-width="3" d=""/>
    </svg>
  </div>

  <script>
    let points = [30, 45, 60, 40, 80, 95, 85, 110, 105, 130, 120, 145, 135, 160];
    function renderChart() {
      const step = 600 / (points.length - 1);
      let d = "M 0 " + (180 - points[0]);
      for (let i = 1; i < points.length; i++) {
        d += " L " + (i * step) + " " + (180 - points[i]);
      }
      document.getElementById('line').setAttribute('d', d);
      document.getElementById('area').setAttribute('d', d + " L 600 180 L 0 180 Z");
    }
    renderChart();

    setInterval(() => {
      points.shift();
      points.push(Math.floor(Math.random() * 80 + 70));
      renderChart();
      document.getElementById('rps').innerText = (14000 + Math.floor(Math.random() * 800)).toLocaleString();
      document.getElementById('lat').innerText = (17 + Math.random() * 3).toFixed(1) + 'ms';
    }, 1500);
  </script>
</body>
</html>`,
};

const ALL_STARTER_ARTIFACTS = [
  STARTER_POMODORO,
  STARTER_WEBSITE,
  STARTER_GAME,
  STARTER_3D,
  STARTER_DASHBOARD,
];

// Templates for "Make something new" section (matching user's reference)
const ARTIFACT_TEMPLATES = [
  {
    id: "docs",
    label: "Docs",
    badge: "New",
    icon: FileText,
    colorClass: "card-blue",
    prompt: "Create a comprehensive, well-structured document about: ",
  },
  {
    id: "slides",
    label: "Slides",
    badge: "New",
    icon: Presentation,
    colorClass: "card-orange",
    prompt: "Create an interactive presentation deck with slide navigation for: ",
  },
  {
    id: "design",
    label: "Design",
    badge: "New",
    icon: Palette,
    colorClass: "card-purple",
    prompt: "Create a modern UI component and interactive design mockup for: ",
  },
  {
    id: "apps",
    label: "Web Apps",
    badge: "New",
    icon: Smartphone,
    colorClass: "card-teal",
    prompt: "Build an interactive web application with reactive state and controls for: ",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    badge: "New",
    icon: BarChart3,
    colorClass: "card-emerald",
    prompt: "Create a live analytics and metrics dashboard with charts for: ",
  },
];

// Available mode choices inside Studio Chatbox
const STUDIO_MODES = [
  { id: "default", label: "Default mode" },
  { id: "website", label: "Website Builder" },
  { id: "app", label: "Interactive Web App" },
  { id: "game", label: "Playable Canvas Game" },
  { id: "3d", label: "Three.js 3D Scene" },
  { id: "dashboard", label: "Live Metrics Dashboard" },
];

export default function Studio({
  isOpen,
  onClose,
  initialArtifact = null,
  onSendMessage,
  onSelectTemplate,
  loading = false,
  isMaximized = false,
  onToggleMaximize,
}) {
  const [artifacts, setArtifacts] = useState(() => {
    try {
      const saved = localStorage.getItem("mollie_studio_artifacts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load artifacts from storage:", e);
    }
    return ALL_STARTER_ARTIFACTS;
  });

  const [activeArtifactId, setActiveArtifactId] = useState(
    initialArtifact?.id || STARTER_POMODORO.id
  );

  // 'creator' (Google AI Studio Creation Template) or 'workspace' (Preview / Code / Docs / Diagram)
  const [viewMode, setViewMode] = useState(initialArtifact ? "workspace" : "creator");
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'code' | 'docs' | 'diagram'
  const [artifactFilter, setArtifactFilter] = useState("all"); // 'all' | 'yours' | 'shared'
  const [artifactSearchQuery, setArtifactSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [artifactLayout, setArtifactLayout] = useState("grid"); // 'grid' | 'list'
  const [editableCode, setEditableCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [selectedStudioMode, setSelectedStudioMode] = useState("default");
  const [studioPrompt, setStudioPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleTemplateClick = (tpl) => {
    if (onSelectTemplate) {
      onSelectTemplate(tpl.id, tpl.prompt);
    } else if (onClose) {
      onClose();
    }
  };

  const filteredArtifacts = artifacts.filter((art) => {
    if (artifactFilter === "shared") return false;
    if (!artifactSearchQuery.trim()) return true;
    const query = artifactSearchQuery.toLowerCase().trim();
    return (
      (art.title || "").toLowerCase().includes(query) ||
      (art.type || "").toLowerCase().includes(query) ||
      (art.language || "").toLowerCase().includes(query)
    );
  });

  const dropdownRef = useRef(null);
  const modeMenuRef = useRef(null);
  const plusMenuRef = useRef(null);
  const textareaRef = useRef(null);
  const recognizerRef = useRef(null);
  const skillsScrollRef = useRef(null);

  // Sync initialArtifact when passed from ChatArea
  useEffect(() => {
    if (initialArtifact && initialArtifact.id) {
      setArtifacts((prev) => {
        const exists = prev.some((a) => a.id === initialArtifact.id);
        const next = exists
          ? prev.map((a) => (a.id === initialArtifact.id ? initialArtifact : a))
          : [initialArtifact, ...prev];
        try {
          localStorage.setItem("mollie_studio_artifacts", JSON.stringify(next));
        } catch {}
        return next;
      });
      setActiveArtifactId(initialArtifact.id);
      setEditableCode(initialArtifact.code || "");
      setViewMode("workspace");
      if (initialArtifact.type === "diagram") {
        setActiveTab("diagram");
      } else if (initialArtifact.type === "docs") {
        setActiveTab("docs");
      } else {
        setActiveTab("preview");
      }
    }
  }, [initialArtifact]);

  // Sync active artifact's code
  const currentArtifact =
    artifacts.find((a) => a.id === activeArtifactId) || artifacts[0] || STARTER_POMODORO;

  useEffect(() => {
    if (currentArtifact) {
      setEditableCode(currentArtifact.code || "");
    }
  }, [currentArtifact?.id]);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target)) {
        setShowModeMenu(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setShowPlusMenu(false);
      }
    }
    if (showDropdown || showModeMenu || showPlusMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, showModeMenu, showPlusMenu]);

  // Voice dictation cleanup
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {}
      }
    };
  }, []);

  if (!isOpen) return null;

  // Toggle voice dictation in Studio prompt
  const handleToggleVoice = () => {
    if (!isSpeechRecognitionSupported()) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {}
        recognizerRef.current = null;
      }
      setIsListening(false);
      return;
    }

    try {
      const recognizer = createSpeechRecognizer({
        onResult: (res) => {
          if (res.full) {
            setStudioPrompt((prev) => {
              const base = prev.trim();
              return base ? `${base} ${res.full}` : res.full;
            });
          }
        },
        onError: () => setIsListening(false),
        onEnd: () => setIsListening(false),
        continuous: false,
      });

      recognizerRef.current = recognizer;
      recognizer.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  // Select skill chips to prompt the user to describe what they want to build
  const handleSelectSkill = (skillType) => {
    let starterPrompt = "";
    let modeId = "default";

    switch (skillType) {
      case "website":
        starterPrompt = "Build a modern, responsive website that ";
        modeId = "website";
        break;
      case "app":
        starterPrompt = "Build an interactive web application that ";
        modeId = "app";
        break;
      case "game":
        starterPrompt = "Build an interactive playable canvas game with ";
        modeId = "game";
        break;
      case "3d":
        starterPrompt = "Build an interactive 3D scene using Three.js with ";
        modeId = "3d";
        break;
      case "dashboard":
        starterPrompt = "Create a live analytics and metrics dashboard for ";
        modeId = "dashboard";
        break;
      case "science":
        starterPrompt = "Build an interactive scientific simulation tool for ";
        modeId = "app";
        break;
      default:
        starterPrompt = "Build an application that ";
        modeId = "default";
    }

    setSelectedStudioMode(modeId);
    setStudioPrompt(starterPrompt);
    setViewMode("creator");

    // Smoothly focus the composer textarea and place cursor at end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, 60);
  };

  // Submit Studio Prompt to Mollie
  const handlePromptSubmit = () => {
    const text = studioPrompt.trim();
    if (!text) return;

    if (onSendMessage) {
      const modeObj = STUDIO_MODES.find((m) => m.id === selectedStudioMode);
      const modeInstruction = modeObj && modeObj.id !== "default"
        ? `[Studio Mode: ${modeObj.label}] `
        : "";
      onSendMessage(`${modeInstruction}${text}`);
    }

    if (onClose) {
      onClose();
    } else {
      setViewMode("workspace");
      setActiveTab("preview");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editableCode || currentArtifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = currentArtifact.language === "html" ? "html" : currentArtifact.language === "svg" ? "svg" : "txt";
    const filename = `${currentArtifact.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${ext}`;
    const blob = new Blob([editableCode || currentArtifact.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewWindow = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(editableCode || currentArtifact.code);
      newWindow.document.close();
    }
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleApplyCodeChanges = () => {
    setArtifacts((prev) => {
      const updated = prev.map((a) =>
        a.id === currentArtifact.id ? { ...a, code: editableCode } : a
      );
      try {
        localStorage.setItem("mollie_studio_artifacts", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setIframeKey((prev) => prev + 1);
    setActiveTab("preview");
  };

  const handleDeleteArtifact = (id, e) => {
    if (e) e.stopPropagation();
    const remaining = artifacts.filter((a) => a.id !== id);
    const updated = remaining.length > 0 ? remaining : ALL_STARTER_ARTIFACTS;
    setArtifacts(updated);
    try {
      localStorage.setItem("mollie_studio_artifacts", JSON.stringify(updated));
    } catch {}
    if (activeArtifactId === id) {
      setActiveArtifactId(updated[0].id);
    }
  };

  const handleScrollSkills = (direction) => {
    if (skillsScrollRef.current) {
      skillsScrollRef.current.scrollBy({
        left: direction === "right" ? 220 : -220,
        behavior: "smooth",
      });
    }
  };

  // Safe wrapping for HTML sandbox
  const getSanitizedSrcDoc = (raw) => {
    if (!raw) return "";
    const trimmed = raw.trim();
    if (trimmed.toLowerCase().includes("<html") || trimmed.toLowerCase().includes("<!doctype")) {
      return trimmed;
    }
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f1422;
      color: #f8fafc;
      padding: 24px;
      margin: 0;
    }
  </style>
</head>
<body>
  ${trimmed}
</body>
</html>`;
  };

  const currentModeLabel =
    STUDIO_MODES.find((m) => m.id === selectedStudioMode)?.label || "Default mode";

  return (
    <div className={`studio-panel-root ${isMaximized ? "maximized" : ""} fade-in`}>
      <div className="studio-container neon-studio-box in-pane">
        {/* Top Header */}
        <header className="studio-header fade-in">
          <div className="studio-brand-group">
            <div className="studio-brand-badge">
              <Layers size={17} className="brand-badge-icon" />
              <span className="brand-badge-text">Studio</span>
            </div>
            {viewMode === "workspace" && currentArtifact && (
              <span className="studio-active-title-label">
                {currentArtifact.title}
              </span>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="studio-actions-group">
            {viewMode === "workspace" && (
              <>
                <button
                  type="button"
                  className="studio-btn"
                  onClick={handleReload}
                  title="Reload sandbox preview"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  type="button"
                  className="studio-btn"
                  onClick={handleCopyCode}
                  title="Copy code to clipboard"
                >
                  {copied ? <Check size={15} className="text-emerald" /> : <Copy size={15} />}
                </button>

                <button
                  type="button"
                  className="studio-btn"
                  onClick={handleDownload}
                  title="Download file"
                >
                  <Download size={15} />
                </button>

                <button
                  type="button"
                  className="studio-btn"
                  onClick={handleOpenNewWindow}
                  title="Open app in a separate browser tab"
                >
                  <ExternalLink size={15} />
                </button>
              </>
            )}

            <button
              type="button"
              className="btn-back-chat"
              onClick={onClose}
              title="Return to Chat"
            >
              <span>Back to Chat</span>
            </button>

            <button
              type="button"
              className="studio-btn btn-close-studio"
              onClick={onClose}
              title="Close Studio and return to Chat"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* ==================================================================
            VIEW 1: MOLLIE STUDIO CREATION TEMPLATE (Prompt Box & Skills)
            ================================================================== */}
        {viewMode === "creator" ? (
          <div className="studio-creator-view fade-in">
            {/* Top Floating Announcement Capsule */}
            <div className="studio-hero-announcement fade-in">
              <span className="studio-pill-orb">
                <img src="/logo.png" alt="JohnGPT" className="studio-pill-logo" />
              </span>
              <span className="studio-pill-text">Introducing JohnGPT Studio Engine v2</span>
            </div>

            {/* Centered Hero Headline */}
            <h1 className="studio-hero-title">Build your ideas with JohnGPT Studio</h1>

            {/* Large Glowing Neon Composer Card */}
            <div className="studio-neon-composer-box">
              <textarea
                ref={textareaRef}
                value={studioPrompt}
                onChange={(e) => setStudioPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe an app, website, or tool and let Mollie Studio do the rest..."
                className="studio-neon-textarea"
                rows={2}
              />

              {/* Bottom Controls Row inside Composer */}
              <div className="studio-neon-composer-footer">
                <div className="studio-composer-left" ref={plusMenuRef}>
                  <button
                    type="button"
                    className="studio-circle-plus-btn"
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                    title="Add context, libraries, or capabilities"
                  >
                    <Plus size={16} />
                  </button>

                  {showPlusMenu && (
                    <div className="studio-plus-dropdown fade-in scale-in">
                      <div className="plus-dropdown-header">Prompt Boosters</div>
                      <button
                        type="button"
                        className="plus-menu-item"
                        onClick={() => {
                          setStudioPrompt((p) => p + " with interactive HTML5 Canvas and particle animations");
                          setShowPlusMenu(false);
                        }}
                      >
                        <Sparkles size={14} className="text-accent" />
                        <span>Interactive HTML5 Canvas</span>
                      </button>
                      <button
                        type="button"
                        className="plus-menu-item"
                        onClick={() => {
                          setStudioPrompt((p) => p + " with Web Audio API sound synthesis");
                          setShowPlusMenu(false);
                        }}
                      >
                        <Gamepad2 size={14} className="text-accent" />
                        <span>Web Audio Sound FX</span>
                      </button>
                      <button
                        type="button"
                        className="plus-menu-item"
                        onClick={() => {
                          setStudioPrompt((p) => p + " using Three.js for 3D graphics");
                          setShowPlusMenu(false);
                        }}
                      >
                        <Atom size={14} className="text-accent" />
                        <span>Three.js 3D Engine</span>
                      </button>
                      <button
                        type="button"
                        className="plus-menu-item"
                        onClick={() => {
                          setStudioPrompt((p) => p + " with localStorage persistence and reactive controls");
                          setShowPlusMenu(false);
                        }}
                      >
                        <Sliders size={14} className="text-accent" />
                        <span>LocalStorage State</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="studio-composer-right">
                  {/* Mode Dropdown Selector */}
                  <div className="studio-mode-selector-wrapper" ref={modeMenuRef}>
                    <button
                      type="button"
                      className="studio-mode-selector-btn"
                      onClick={() => setShowModeMenu(!showModeMenu)}
                    >
                      <span>{currentModeLabel}</span>
                      <ChevronDown size={14} className="caret-icon" />
                    </button>

                    {showModeMenu && (
                      <div className="studio-mode-dropdown fade-in scale-in">
                        <div className="mode-dropdown-header">Generation Target</div>
                        {STUDIO_MODES.map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            className={`mode-menu-item ${selectedStudioMode === mode.id ? "active" : ""}`}
                            onClick={() => {
                              setSelectedStudioMode(mode.id);
                              setShowModeMenu(false);
                            }}
                          >
                            <span>{mode.label}</span>
                            {selectedStudioMode === mode.id && <Check size={14} className="text-accent" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Microphone Voice Dictation */}
                  <button
                    type="button"
                    className={`studio-composer-icon-btn ${isListening ? "listening active" : ""}`}
                    onClick={handleToggleVoice}
                    title={isListening ? "Stop listening" : "Dictate prompt with voice"}
                  >
                    {isListening ? <MicOff size={16} className="text-danger" /> : <Mic size={16} />}
                  </button>

                  {/* Prominent Action Button: Create with Studio */}
                  <button
                    type="button"
                    className="studio-btn-lucky-action"
                    onClick={handlePromptSubmit}
                    title="Generate and launch in live sandbox"
                    disabled={loading}
                  >
                    <Sparkles size={15} className="sparkle-lucky" />
                    <span>Create with Studio</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Skills Row Below The Chatbox */}
            <div className="studio-skills-container">
              <div className="studio-skills-scroll-area" ref={skillsScrollRef}>
                <button
                  type="button"
                  className="studio-skill-chip"
                  onClick={() => handleSelectSkill("website")}
                >
                  <Globe size={15} className="skill-icon text-cyan" />
                  <span>Create a website</span>
                </button>

                <button
                  type="button"
                  className="studio-skill-chip"
                  onClick={() => handleSelectSkill("app")}
                >
                  <Smartphone size={15} className="skill-icon text-accent" />
                  <span>Create an app</span>
                </button>

                <button
                  type="button"
                  className="studio-skill-chip"
                  onClick={() => handleSelectSkill("game")}
                >
                  <Gamepad2 size={15} className="skill-icon text-indigo" />
                  <span>Create a game</span>
                </button>

                <button
                  type="button"
                  className="studio-skill-chip"
                  onClick={() => handleSelectSkill("3d")}
                >
                  <Atom size={15} className="skill-icon text-purple" />
                  <span>Three.js 3D scenes</span>
                </button>

                <button
                  type="button"
                  className="studio-skill-chip"
                  onClick={() => handleSelectSkill("dashboard")}
                >
                  <BarChart3 size={15} className="skill-icon text-emerald" />
                  <span>Data dashboard</span>
                </button>

                <button
                  type="button"
                  className="studio-skill-chip"
                  onClick={() => handleSelectSkill("science")}
                >
                  <Sparkles size={15} className="skill-icon text-amber" />
                  <span>Add Bioscience Skills</span>
                </button>
              </div>

              {/* Scroll Chevron */}
              <button
                type="button"
                className="studio-skills-nav-btn"
                onClick={() => handleScrollSkills("right")}
                title="Scroll more skills"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* ==================================================================
             VIEW 2: WORKSPACE SANDBOX / CODE / DOCS / DIAGRAM
             ================================================================== */
          <div className="studio-body">
            {/* 1. App Preview (Live Sandboxed iframe) */}
            {activeTab === "preview" && (
              <div className="studio-viewport-panel fade-in">
                <iframe
                  key={iframeKey}
                  title={currentArtifact.title}
                  className="studio-live-iframe"
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  srcDoc={getSanitizedSrcDoc(editableCode || currentArtifact.code)}
                />
              </div>
            )}

            {/* 2. Code Studio (Editable code with live sync) */}
            {activeTab === "code" && (
              <div className="studio-code-panel fade-in">
                <div className="code-panel-toolbar">
                  <div className="code-lang-tag">
                    <span>Language: {currentArtifact.language || "HTML / JS / CSS"}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-apply-code"
                    onClick={handleApplyCodeChanges}
                    title="Apply changes and refresh App Preview"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Run Changes in Preview</span>
                  </button>
                </div>
                <textarea
                  value={editableCode}
                  onChange={(e) => setEditableCode(e.target.value)}
                  className="studio-code-editor"
                  spellCheck="false"
                  placeholder="Enter HTML, CSS, or JS code here..."
                />
              </div>
            )}

            {/* 3. Document Editor */}
            {activeTab === "docs" && (
              <div className="studio-docs-panel fade-in">
                <div className="docs-panel-header">
                  <div className="docs-panel-title">
                    <FileText size={16} className="text-accent" />
                    <span>Interactive Document Canvas</span>
                  </div>
                </div>
                <div className="docs-editor-container">
                  <textarea
                    value={editableCode}
                    onChange={(e) => setEditableCode(e.target.value)}
                    className="studio-docs-editor"
                    placeholder="Type or format your live markdown and documentation here..."
                  />
                </div>
              </div>
            )}

            {/* 4. Diagram Builder */}
            {activeTab === "diagram" && (
              <div className="studio-diagram-panel fade-in">
                <div className="diagram-panel-header">
                  <GitBranch size={16} className="text-accent" />
                  <span>SVG / Mermaid Visual Architecture</span>
                </div>
                <div className="diagram-canvas-area">
                  <iframe
                    key={`diag-${iframeKey}`}
                    title="Diagram Render"
                    className="studio-live-iframe"
                    sandbox="allow-scripts"
                    srcDoc={getSanitizedSrcDoc(editableCode)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
