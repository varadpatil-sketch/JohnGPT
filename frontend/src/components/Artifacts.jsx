import React, { useState } from "react";
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
} from "lucide-react";

const ARTIFACT_TEMPLATES = [
  {
    id: "docs",
    label: "Docs",
    badge: "New",
    icon: FileText,
    colorClass: "card-blue",
    prompt: "Create a structured documentation artifact with formatted sections and code examples for: ",
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

export default function Artifacts({ onClose, onSelectTemplate }) {
  const [artifactFilter, setArtifactFilter] = useState("all");
  const [artifactSearchQuery, setArtifactSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [artifactLayout, setArtifactLayout] = useState("grid");

  const handleTemplateClick = (tpl) => {
    if (onSelectTemplate) {
      onSelectTemplate(tpl.id, tpl.prompt);
    } else if (onClose) {
      onClose();
    }
  };

  const filteredTemplates = ARTIFACT_TEMPLATES.filter((tpl) => {
    if (!artifactSearchQuery.trim()) return true;
    return tpl.label.toLowerCase().includes(artifactSearchQuery.toLowerCase().trim());
  });

  return (
    <div className="artifacts-hub-view fade-in">
      {/* Top Hub Navigation & Controls */}
      <div className="artifacts-hub-header">
        <div className="hub-header-left">
          <h1 className="artifacts-page-title">Artifacts</h1>
          <div className="artifacts-filter-tabs">
            <button
              type="button"
              className={`artifact-filter-pill ${artifactFilter === "all" ? "active" : ""}`}
              onClick={() => setArtifactFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`artifact-filter-pill ${artifactFilter === "yours" ? "active" : ""}`}
              onClick={() => setArtifactFilter("yours")}
            >
              Yours
            </button>
            <button
              type="button"
              className={`artifact-filter-pill ${artifactFilter === "shared" ? "active" : ""}`}
              onClick={() => setArtifactFilter("shared")}
            >
              Shared with you
            </button>
          </div>
        </div>

        <div className="hub-header-right">
          {isSearchVisible ? (
            <div className="hub-search-box fade-in">
              <Search size={15} className="hub-search-icon" />
              <input
                type="text"
                className="hub-search-input"
                placeholder="Search templates..."
                value={artifactSearchQuery}
                onChange={(e) => setArtifactSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="hub-search-close"
                onClick={() => {
                  setIsSearchVisible(false);
                  setArtifactSearchQuery("");
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="hub-icon-action-btn"
              onClick={() => setIsSearchVisible(true)}
              title="Search artifacts"
            >
              <Search size={17} />
            </button>
          )}

          <button
            type="button"
            className="hub-icon-action-btn"
            title="Filter options"
            onClick={() => {
              setArtifactFilter((prev) =>
                prev === "all" ? "yours" : prev === "yours" ? "shared" : "all"
              );
            }}
          >
            <SlidersHorizontal size={17} />
          </button>

          <div className="hub-layout-toggles">
            <button
              type="button"
              className={`hub-layout-btn ${artifactLayout === "grid" ? "active" : ""}`}
              onClick={() => setArtifactLayout("grid")}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={`hub-layout-btn ${artifactLayout === "list" ? "active" : ""}`}
              onClick={() => setArtifactLayout("list")}
              title="List view"
            >
              <List size={16} />
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

      {/* Hub Scrollable Content Area */}
      <div className="artifacts-hub-content custom-scrollbar">
        {/* Make Something New Section */}
        <div className="hub-section">
          <h3 className="hub-section-heading">Make something new</h3>
          <div className="hub-templates-grid">
            {filteredTemplates.map((tpl) => {
              const IconComponent = tpl.icon;
              return (
                <div
                  key={tpl.id}
                  className="hub-template-wrapper"
                  onClick={() => handleTemplateClick(tpl)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleTemplateClick(tpl);
                    }
                  }}
                >
                  <div className={`hub-template-card ${tpl.colorClass}`}>
                    <div className="card-sketch-overlay" />
                    <div className="template-card-preview">
                      <IconComponent size={34} strokeWidth={1.8} className="template-card-icon" />
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

        {/* Minimalist Geometric Line Art Empty / Intro State matching reference image */}
        <div className="artifacts-empty-state-card">
          <div className="artifacts-empty-illustration">
            <svg
              width="110"
              height="75"
              viewBox="0 0 110 75"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="neon-geometric-svg"
            >
              <polygon
                points="28,12 50,62 6,62"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <circle
                cx="56"
                cy="26"
                r="16"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <rect
                x="40"
                y="42"
                width="26"
                height="20"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="artifacts-empty-title">Your artifacts live here</h3>
          <p className="artifacts-empty-subtitle">
            Start from a template above, or ask JohnGPT to build something in any chat.
          </p>
        </div>
      </div>
    </div>
  );
}
