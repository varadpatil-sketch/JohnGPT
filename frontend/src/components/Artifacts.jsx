import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Presentation,
  Palette,
  Smartphone,
  BarChart3,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  Plus,
  Play,
  Download,
  Trash2,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { DEFAULT_FOOTBALL_DECK } from "./SlideStudio";
import { DEFAULT_AI_DOC } from "./DocStudio";
import { DEFAULT_DASHBOARD_APP } from "./AppStudio";

export const DEFAULT_BUDGET_APP = {
  id: "app-budget-calculator",
  title: "Interactive Loan & Budget Calculator",
  type: "app",
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loan Calculator</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
    }
    .card {
      max-width: 480px;
      margin: 0 auto;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h2 { font-size: 1.4rem; margin-bottom: 6px; }
    p.sub { font-size: 0.82rem; color: #94a3b8; margin-bottom: 20px; }
    .input-group { margin-bottom: 16px; }
    label { display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; }
    .slider-row { display: flex; align-items: center; gap: 12px; }
    input[type=range] { flex: 1; accent-color: #38bdf8; }
    .val-badge { min-width: 80px; text-align: right; font-weight: 700; color: #38bdf8; font-family: monospace; }
    .result-box {
      margin-top: 24px;
      background: #0f172a;
      border: 1px solid #38bdf8;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    .res-lbl { font-size: 0.78rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .res-amount { font-size: 2.2rem; font-weight: 800; color: #38bdf8; margin: 4px 0; }
    .res-sub { font-size: 0.75rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Loan & Mortgage Calculator</h2>
    <p class="sub">Instant monthly repayment breakdown</p>
    
    <div class="input-group">
      <label>Loan Amount ($)</label>
      <div class="slider-row">
        <input type="range" id="amount" min="10000" max="1000000" step="5000" value="250000" oninput="calc()">
        <span class="val-badge" id="amountVal">$250,000</span>
      </div>
    </div>

    <div class="input-group">
      <label>Annual Interest Rate (%)</label>
      <div class="slider-row">
        <input type="range" id="rate" min="1" max="15" step="0.1" value="5.5" oninput="calc()">
        <span class="val-badge" id="rateVal">5.5%</span>
      </div>
    </div>

    <div class="input-group">
      <label>Loan Term (Years)</label>
      <div class="slider-row">
        <input type="range" id="term" min="5" max="30" step="1" value="25" oninput="calc()">
        <span class="val-badge" id="termVal">25 yrs</span>
      </div>
    </div>

    <div class="result-box">
      <div class="res-lbl">Estimated Monthly Payment</div>
      <div class="res-amount" id="monthlyVal">$1,535</div>
      <div class="res-sub" id="totalInterest">Total Interest: $210,500</div>
    </div>
  </div>

  <script>
    function calc() {
      const p = parseFloat(document.getElementById('amount').value);
      const r = parseFloat(document.getElementById('rate').value) / 100 / 12;
      const n = parseFloat(document.getElementById('term').value) * 12;

      document.getElementById('amountVal').innerText = '$' + p.toLocaleString();
      document.getElementById('rateVal').innerText = document.getElementById('rate').value + '%';
      document.getElementById('termVal').innerText = document.getElementById('term').value + ' yrs';

      const monthly = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalPaid = monthly * n;
      const totalInt = totalPaid - p;

      document.getElementById('monthlyVal').innerText = '$' + Math.round(monthly).toLocaleString();
      document.getElementById('totalInterest').innerText = 'Total Interest: $' + Math.round(totalInt).toLocaleString();
    }
  </script>
</body>
</html>`,
};

const INITIAL_ARTIFACTS = [
  {
    id: "art-football-slides",
    title: "Football (The Beautiful Game)",
    type: "slides",
    category: "Slides",
    summary: "6-slide editorial presentation with KPIs, core rules, positions & World Cup stats.",
    updatedAt: "Just now",
    data: DEFAULT_FOOTBALL_DECK,
  },
  {
    id: "art-ai-sys-doc",
    title: "Next-Gen AI System Architecture",
    type: "doc",
    category: "Docs",
    summary: "High-throughput architecture blueprint, streaming latency benchmarks & pipeline spec.",
    updatedAt: "2 hours ago",
    data: DEFAULT_AI_DOC,
  },
  {
    id: "art-saas-dashboard",
    title: "Modern SaaS Analytics Dashboard",
    type: "app",
    category: "Dashboard",
    summary: "Live interactive MRR metrics, subscriber trend bar chart, and churn telemetry.",
    updatedAt: "Yesterday",
    data: DEFAULT_DASHBOARD_APP,
  },
  {
    id: "art-budget-calculator",
    title: "Interactive Loan & Budget Calculator",
    type: "app",
    category: "Web Apps",
    summary: "Reactive mortgage slider calculator with real-time monthly payment calculation.",
    updatedAt: "2 days ago",
    data: DEFAULT_BUDGET_APP,
  },
];

const ARTIFACT_TEMPLATES = [
  {
    id: "docs",
    label: "Docs",
    badge: "New",
    icon: FileText,
    colorClass: "card-blue",
    description: "Technical design docs, PRDs, research briefs & structured specifications.",
    defaultTopic: "Next-Gen AI System Architecture",
  },
  {
    id: "slides",
    label: "Slides",
    badge: "New",
    icon: Presentation,
    colorClass: "card-orange",
    description: "16:9 interactive presentation decks with filmstrip & PowerPoint (.pptx) export.",
    defaultTopic: "Football (The Beautiful Game)",
  },
  {
    id: "design",
    label: "Design",
    badge: "New",
    icon: Palette,
    colorClass: "card-purple",
    description: "Glassmorphism UI components, interactive mockups & landing page heroes.",
    defaultTopic: "Glassmorphic Hero Section",
  },
  {
    id: "apps",
    label: "Web Apps",
    badge: "New",
    icon: Smartphone,
    colorClass: "card-teal",
    description: "Reactive single-file web applications, calculators, utilities & tools.",
    defaultTopic: "Interactive Loan & Budget Calculator",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    badge: "New",
    icon: BarChart3,
    colorClass: "card-emerald",
    description: "Live KPI metrics, trend charts, conversion funnels & business telemetry.",
    defaultTopic: "SaaS Revenue & Retention Dashboard",
  },
];

const STORAGE_KEY_USER_ARTIFACTS = "johngpt_user_artifacts_v1";

export default function Artifacts({ onClose, onOpenArtifact, onSelectTemplate }) {
  const [artifacts, setArtifacts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_ARTIFACTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Error reading artifacts from localStorage:", e);
    }
    return INITIAL_ARTIFACTS;
  });

  const [artifactFilter, setArtifactFilter] = useState("all"); // "all" | "slides" | "doc" | "app"
  const [searchQuery, setSearchQuery] = useState("");
  const [artifactLayout, setArtifactLayout] = useState("grid");
  const [activeCreatorModal, setActiveCreatorModal] = useState(null); // template object
  const [topicInput, setTopicInput] = useState("");

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER_ARTIFACTS, JSON.stringify(artifacts));
    } catch (e) {
      console.warn("Error saving artifacts:", e);
    }
  }, [artifacts]);

  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((art) => {
      // Type filter
      if (artifactFilter === "slides" && art.type !== "slides") return false;
      if (artifactFilter === "doc" && art.type !== "doc") return false;
      if (artifactFilter === "app" && art.type !== "app") return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (art.title || "").toLowerCase().includes(q) ||
        (art.summary || "").toLowerCase().includes(q) ||
        (art.category || "").toLowerCase().includes(q)
      );
    });
  }, [artifacts, artifactFilter, searchQuery]);

  const handleOpenSingleArtifact = (art) => {
    if (onOpenArtifact) {
      onOpenArtifact(art);
    }
  };

  const handleDeleteArtifact = (id, e) => {
    e.stopPropagation();
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTemplateClick = (tpl) => {
    setActiveCreatorModal(tpl);
    setTopicInput(tpl.defaultTopic || "");
  };

  const handleGenerateWithAi = () => {
    if (!activeCreatorModal) return;
    const tpl = activeCreatorModal;
    const topic = topicInput.trim() || tpl.defaultTopic;
    let promptText = "";
    if (tpl.id === "slides") {
      promptText = `Create an interactive presentation deck on: ${topic}`;
    } else if (tpl.id === "docs") {
      promptText = `Write a technical specification and documentation artifact for: ${topic}`;
    } else if (tpl.id === "dashboard") {
      promptText = `Build an interactive dashboard with live metrics and charts for: ${topic}`;
    } else {
      promptText = `Build an interactive web application for: ${topic}`;
    }
    setActiveCreatorModal(null);
    if (onSelectTemplate) {
      onSelectTemplate(tpl.id, promptText);
    }
  };

  const handleConfirmCreate = () => {
    if (!activeCreatorModal) return;
    const tpl = activeCreatorModal;
    const topic = topicInput.trim() || tpl.defaultTopic;
    const newId = `art-${Date.now()}`;

    let newArt = null;

    if (tpl.id === "slides") {
      newArt = {
        id: newId,
        title: topic,
        type: "slides",
        category: "Slides",
        summary: `Interactive presentation deck for ${topic} with 16:9 canvas and PowerPoint export.`,
        updatedAt: "Just now",
        data: {
          ...DEFAULT_FOOTBALL_DECK,
          id: `deck-${Date.now()}`,
          title: topic,
          slides: DEFAULT_FOOTBALL_DECK.slides.map((s, idx) => {
            if (idx === 0) {
              return {
                ...s,
                kicker: "PRESENTATION DECK",
                title: topic,
                subtitle: `Executive summary, key metrics, and strategic overview for ${topic}.`,
              };
            }
            return s;
          }),
        },
      };
    } else if (tpl.id === "docs") {
      newArt = {
        id: newId,
        title: topic,
        type: "doc",
        category: "Docs",
        summary: `Structured specification and technical document for ${topic}.`,
        updatedAt: "Just now",
        data: {
          ...DEFAULT_AI_DOC,
          id: `doc-${Date.now()}`,
          title: topic,
          content: `# ${topic}\n*Technical Specification & Comprehensive Guide*\n\n> **Overview:** Structured documentation and operational blueprint for ${topic}.\n\n---\n\n## 1. Executive Summary & Goals\n\nDetailed objectives and strategic context for ${topic}.\n\n---\n\n## 2. Core Architecture & Specifications\n\nKey parameters, modules, and operational flow.\n\n---\n\n## 3. Implementation Roadmap & Next Steps\n\nActionable milestones and deployment guidelines.\n`,
        },
      };
    } else if (tpl.id === "dashboard") {
      newArt = {
        id: newId,
        title: topic,
        type: "app",
        category: "Dashboard",
        summary: `Live analytics and telemetry dashboard for ${topic}.`,
        updatedAt: "Just now",
        data: DEFAULT_DASHBOARD_APP,
      };
    } else {
      newArt = {
        id: newId,
        title: topic,
        type: "app",
        category: tpl.id === "design" ? "Design" : "Web Apps",
        summary: `Interactive application and reactive UI mockup for ${topic}.`,
        updatedAt: "Just now",
        data: DEFAULT_BUDGET_APP,
      };
    }

    setArtifacts((prev) => [newArt, ...prev]);
    setActiveCreatorModal(null);

    // Open it immediately in the workspace!
    if (onOpenArtifact) {
      onOpenArtifact(newArt);
    }
  };

  return (
    <div className="artifacts-hub-view fade-in">
      {/* 1. Top Hub Header */}
      <div className="artifacts-hub-header">
        <div className="hub-header-left">
          <h1 className="artifacts-page-title">Artifacts</h1>
          <div className="artifacts-filter-tabs">
            <button
              type="button"
              className={`artifact-filter-pill ${artifactFilter === "all" ? "active" : ""}`}
              onClick={() => setArtifactFilter("all")}
            >
              All ({artifacts.length})
            </button>
            <button
              type="button"
              className={`artifact-filter-pill ${artifactFilter === "slides" ? "active" : ""}`}
              onClick={() => setArtifactFilter("slides")}
            >
              Slides
            </button>
            <button
              type="button"
              className={`artifact-filter-pill ${artifactFilter === "doc" ? "active" : ""}`}
              onClick={() => setArtifactFilter("doc")}
            >
              Docs
            </button>
            <button
              type="button"
              className={`artifact-filter-pill ${artifactFilter === "app" ? "active" : ""}`}
              onClick={() => setArtifactFilter("app")}
            >
              UIs & Web Apps
            </button>
          </div>
        </div>

        <div className="hub-header-right">
          <div className="hub-search-box">
            <Search size={14} className="hub-search-icon" />
            <input
              type="text"
              className="hub-search-input"
              placeholder="Search artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="hub-search-close"
                onClick={() => setSearchQuery("")}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="hub-layout-toggles">
            <button
              type="button"
              className={`hub-layout-btn ${artifactLayout === "grid" ? "active" : ""}`}
              onClick={() => setArtifactLayout("grid")}
              title="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`hub-layout-btn ${artifactLayout === "list" ? "active" : ""}`}
              onClick={() => setArtifactLayout("list")}
              title="List view"
            >
              <List size={15} />
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              className="btn-back-chat neon-pill-btn"
              onClick={onClose}
              title="Return to main chatbox"
            >
              Back to Chat
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Hub Content Area */}
      <div className="artifacts-hub-content custom-scrollbar">
        {/* Section 1: Make Something New (Templates) */}
        <div className="hub-section">
          <div className="section-title-row">
            <h3 className="hub-section-heading">Make something new</h3>
            <span className="section-sub-tag">Click any template to generate and open instantly</span>
          </div>

          <div className="hub-templates-grid">
            {ARTIFACT_TEMPLATES.map((tpl) => {
              const IconComponent = tpl.icon;
              return (
                <div
                  key={tpl.id}
                  className="hub-template-wrapper"
                  onClick={() => handleTemplateClick(tpl)}
                  role="button"
                  tabIndex={0}
                  title={`Create new ${tpl.label}`}
                >
                  <div className={`hub-template-card ${tpl.colorClass}`}>
                    <div className="card-sketch-overlay" />
                    <div className="template-card-preview">
                      <IconComponent size={32} strokeWidth={1.8} className="template-card-icon" />
                    </div>
                  </div>
                  <div className="template-card-meta">
                    <span className="template-card-label">{tpl.label}</span>
                    {tpl.badge && <span className="template-new-badge">{tpl.badge}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Active / Created Artifacts Gallery */}
        <div className="hub-section">
          <div className="section-title-row">
            <h3 className="hub-section-heading">Your Artifacts</h3>
            <span className="section-sub-tag">{filteredArtifacts.length} ready to view & edit</span>
          </div>

          {filteredArtifacts.length === 0 ? (
            <div className="artifacts-empty-state-card">
              <Sparkles size={36} className="text-accent" style={{ marginBottom: 12 }} />
              <h3 className="artifacts-empty-title">No matching artifacts found</h3>
              <p className="artifacts-empty-subtitle">
                Try a different search term or click any template above to build a new one.
              </p>
            </div>
          ) : (
            <div className={`artifacts-gallery-container ${artifactLayout === "list" ? "list-mode" : "grid-mode"}`}>
              {filteredArtifacts.map((art) => {
                const isSlides = art.type === "slides";
                const isDoc = art.type === "doc";
                const isApp = art.type === "app";

                const IconComponent = isSlides
                  ? Presentation
                  : isDoc
                  ? FileText
                  : art.category === "Dashboard"
                  ? BarChart3
                  : art.category === "Design"
                  ? Palette
                  : Smartphone;

                const colorClass = isSlides
                  ? "theme-amber"
                  : isDoc
                  ? "theme-blue"
                  : art.category === "Dashboard"
                  ? "theme-emerald"
                  : art.category === "Design"
                  ? "theme-purple"
                  : "theme-teal";

                return (
                  <div
                    key={art.id}
                    className={`artifact-item-card ${colorClass} fade-in`}
                    onClick={() => handleOpenSingleArtifact(art)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="card-top-header">
                      <div className="card-type-pill">
                        <IconComponent size={13} />
                        <span>{art.category || art.type}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-card-delete"
                        onClick={(e) => handleDeleteArtifact(art.id, e)}
                        title="Delete artifact"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="card-content-area">
                      <h4 className="artifact-item-title">{art.title}</h4>
                      <p className="artifact-item-summary">{art.summary}</p>
                    </div>

                    <div className="card-footer-action">
                      <span className="card-timestamp">{art.updatedAt || "Active"}</span>
                      <div className="card-btn-open">
                        <span>Open</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Quick Creator Modal */}
      {activeCreatorModal && (() => {
        const ModalIcon = activeCreatorModal.icon;
        return (
          <div className="creator-modal-backdrop fade-in" onClick={() => setActiveCreatorModal(null)}>
            <div className="creator-modal-box scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="creator-modal-header">
                <div className="modal-title-row">
                  <ModalIcon size={20} className="text-accent" />
                  <h3 className="modal-title">Create {activeCreatorModal.label} Artifact</h3>
                </div>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setActiveCreatorModal(null)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="creator-modal-body">
                <p className="modal-desc">{activeCreatorModal.description}</p>

                <label className="modal-field-label">Topic or Title</label>
                <input
                  type="text"
                  className="modal-topic-input"
                  placeholder="e.g. Football, Electric Vehicles, SaaS Dashboard..."
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateWithAi()}
                  autoFocus
                />

                <div className="modal-quick-suggestions">
                  <span className="suggestion-label">Sample topic:</span>
                  <button
                    type="button"
                    className="suggestion-chip"
                    onClick={() => setTopicInput(activeCreatorModal.defaultTopic)}
                  >
                    {activeCreatorModal.defaultTopic}
                  </button>
                </div>
              </div>

              <div className="creator-modal-footer">
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={() => setActiveCreatorModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={handleConfirmCreate}
                  title="Open instant template with this title"
                >
                  <span>Open Template</span>
                </button>
                <button
                  type="button"
                  className="btn-modal-primary"
                  onClick={handleGenerateWithAi}
                  title="Ask JohnGPT to generate full custom slides on this topic"
                >
                  <Sparkles size={15} />
                  <span>Generate with AI</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
