import React, { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  X,
  Code2,
  Play,
  Layers,
} from "lucide-react";

export const DEFAULT_DASHBOARD_APP = {
  id: "app-saas-dashboard",
  title: "Modern SaaS Analytics Dashboard",
  type: "app",
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaaS Analytics Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0b0f19;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
      user-select: none;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .title { font-size: 1.5rem; font-weight: 700; }
    .subtitle { font-size: 0.85rem; color: #94a3b8; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: #151c2c;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 18px;
    }
    .metric-lbl { font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; }
    .metric-val { font-size: 1.8rem; font-weight: 700; color: #38bdf8; margin-bottom: 6px; }
    .metric-trend { font-size: 0.75rem; color: #10b981; font-weight: 600; }
    .chart-box {
      background: #151c2c;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .chart-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 14px;
      height: 140px;
      padding-top: 10px;
    }
    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      height: 100%;
      justify-content: flex-end;
    }
    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, #38bdf8 0%, #1d4ed8 100%);
      border-radius: 4px;
      transition: height 0.3s ease;
    }
    .bar-lbl { font-size: 0.75rem; color: #64748b; }
    .actions {
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 8px 14px;
      border-radius: 8px;
      background: #38bdf8;
      border: none;
      color: #0b0f19;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .btn:hover { background: #7dd3fc; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">SaaS Revenue & Retention</div>
      <div class="subtitle">Live cloud analytics overview</div>
    </div>
    <div class="actions">
      <button class="btn" onclick="randomizeData()">Refresh Data</button>
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-lbl">Monthly Recurring (MRR)</div>
      <div class="metric-val" id="mrrVal">$48,250</div>
      <div class="metric-trend">▲ +14.2% vs last month</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">Active Subscribers</div>
      <div class="metric-val" id="subsVal">1,420</div>
      <div class="metric-trend">▲ +88 new accounts</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">Net Revenue Retention</div>
      <div class="metric-val">118%</div>
      <div class="metric-trend">▲ Tier 1 benchmark</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">Churn Rate</div>
      <div class="metric-val" style="color: #10b981;">0.8%</div>
      <div class="metric-trend">▼ -0.3% improvements</div>
    </div>
  </div>

  <div class="chart-box">
    <div class="chart-title">Weekly Ingestion Velocity</div>
    <div class="bar-chart" id="chartTrack">
      <div class="bar-col"><div class="bar-fill" style="height: 45%;"></div><span class="bar-lbl">Mon</span></div>
      <div class="bar-col"><div class="bar-fill" style="height: 65%;"></div><span class="bar-lbl">Tue</span></div>
      <div class="bar-col"><div class="bar-fill" style="height: 55%;"></div><span class="bar-lbl">Wed</span></div>
      <div class="bar-col"><div class="bar-fill" style="height: 85%;"></div><span class="bar-lbl">Thu</span></div>
      <div class="bar-col"><div class="bar-fill" style="height: 70%;"></div><span class="bar-lbl">Fri</span></div>
      <div class="bar-col"><div class="bar-fill" style="height: 95%;"></div><span class="bar-lbl">Sat</span></div>
      <div class="bar-col"><div class="bar-fill" style="height: 60%;"></div><span class="bar-lbl">Sun</span></div>
    </div>
  </div>

  <script>
    function randomizeData() {
      const bars = document.querySelectorAll('.bar-fill');
      bars.forEach(b => {
        b.style.height = (30 + Math.floor(Math.random() * 65)) + '%';
      });
      const newMrr = 45000 + Math.floor(Math.random() * 8000);
      document.getElementById('mrrVal').innerText = '$' + newMrr.toLocaleString();
    }
  </script>
</body>
</html>`,
};

export default function AppStudio({
  app: initialApp = null,
  onClose,
  isSplitView = false,
  onToggleSplitView,
}) {
  const [app, setApp] = useState(() => initialApp || DEFAULT_DASHBOARD_APP);
  const [viewport, setViewport] = useState("desktop"); // "desktop" | "tablet" | "mobile"
  const [reloadKey, setReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState("preview"); // "preview" | "code"
  const [copied, setCopied] = useState(false);

  const iframeRef = useRef(null);

  const htmlContent = app.html || app.code || "";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(app.title || "interactive-app").replace(/[^a-zA-Z0-9_-]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`app-studio-workspace ${isSplitView ? "in-split" : ""}`}>
      {/* Header Bar */}
      <div className="app-studio-header">
        <div className="app-header-left">
          <div className="app-icon-badge">
            <Layers size={17} className="text-teal" />
          </div>
          <div className="app-title-meta">
            <span className="app-main-title">{app.title || "Interactive App"}</span>
            <span className="app-sub-meta">Live Interactive Sandbox</span>
          </div>
        </div>

        {/* Viewport Toggles (Desktop, Tablet, Mobile) */}
        <div className="app-viewport-toggles">
          <button
            type="button"
            className={`viewport-btn ${viewport === "desktop" ? "active" : ""}`}
            onClick={() => setViewport("desktop")}
            title="Desktop view"
          >
            <Monitor size={15} />
          </button>
          <button
            type="button"
            className={`viewport-btn ${viewport === "tablet" ? "active" : ""}`}
            onClick={() => setViewport("tablet")}
            title="Tablet view (768px)"
          >
            <Tablet size={15} />
          </button>
          <button
            type="button"
            className={`viewport-btn ${viewport === "mobile" ? "active" : ""}`}
            onClick={() => setViewport("mobile")}
            title="Mobile view (375px)"
          >
            <Smartphone size={15} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="app-header-right">
          <button
            type="button"
            className="app-tool-btn"
            onClick={() => setReloadKey((k) => k + 1)}
            title="Reload sandbox"
          >
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            className={`app-tool-btn ${viewMode === "code" ? "active" : ""}`}
            onClick={() => setViewMode(viewMode === "code" ? "preview" : "code")}
            title={viewMode === "code" ? "Switch to preview" : "View source code"}
          >
            <Code2 size={15} />
          </button>

          <div className="app-header-divider" />

          <button
            type="button"
            className="app-tool-btn"
            onClick={handleDownload}
            title="Download standalone HTML file"
          >
            <Download size={15} />
          </button>

          <button
            type="button"
            className={`app-tool-btn ${copied ? "copied" : ""}`}
            onClick={handleCopyCode}
            title="Copy app code"
          >
            {copied ? <Check size={15} className="text-emerald" /> : <Copy size={15} />}
          </button>

          {onToggleSplitView && (
            <button
              type="button"
              className="app-tool-btn"
              onClick={onToggleSplitView}
              title={isSplitView ? "Maximize view" : "Split view"}
            >
              {isSplitView ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              className="app-tool-btn btn-close-app"
              onClick={onClose}
              title="Close app sandbox"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Sandbox Stage */}
      <div className="app-sandbox-stage custom-scrollbar">
        {viewMode === "code" ? (
          <div className="app-code-view custom-scrollbar">
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "monospace" }}>
              {htmlContent}
            </pre>
          </div>
        ) : (
          <div className={`sandbox-frame-container viewport-${viewport}`}>
            <iframe
              key={reloadKey}
              ref={iframeRef}
              srcDoc={htmlContent}
              title={app.title || "Interactive Sandbox"}
              sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
              className="sandbox-iframe"
            />
          </div>
        )}
      </div>
    </div>
  );
}

