import React, { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  Maximize2,
  Minimize2,
  X,
  Edit3,
  Eye,
  ListTree,
  ChevronRight,
  Share2,
} from "lucide-react";

export const DEFAULT_AI_DOC = {
  id: "doc-ai-system-architecture",
  title: "Next-Gen AI Agent System Architecture",
  subtitle: "Technical Specification & High-Throughput Production Design",
  author: "JohnGPT Engineering",
  date: "November 2026",
  type: "doc",
  content: `# Next-Gen AI Agent System Architecture
*Technical Specification & High-Throughput Production Design*

> **Executive Summary:** This document outlines the architectural blueprint for an enterprise-grade agentic AI assistant capable of multi-tool execution, sub-second streaming latency, and local artifact compilation.

---

## 1. System Overview & Core Tenets

Modern LLM user interfaces require tight coupling between streaming conversational inference and deterministic sandbox artifacts. 

The three governing tenets of this architecture are:
1. **Zero-Flicker Streaming:** Visual elements and code blocks must render progressively without layout shifting or iframe remounts.
2. **First-Class Artifacts:** Presentations, technical documentation, and interactive UI applications exist as standalone persistent entities.
3. **Edge-First Offline Fallbacks:** Export workflows (PowerPoint .pptx, Markdown .md, Standalone HTML) execute entirely client-side without round-tripping to cloud servers.

---

## 2. Component Pipeline & Data Flow

\`\`\`
[ Client Browser ] <--- SSE Token Stream ---> [ FastAPI Edge Gateway ]
        |                                                |
  Artifact Parser                                  Tool Router & GenAI
        |                                                |
[ SlideStudio / DocStudio ] <--- Direct Memory ---> [ SQLite Session DB ]
\`\`\`

### 2.1 Latency Benchmarks
| Processing Stage | Target Latency | Actual (p95) | Optimization Technique |
| :--- | :--- | :--- | :--- |
| Handshake & TTFT | < 1,500ms | 1,380ms | Gemini 3.5 Flash Model Warmup |
| Per-Token Streaming | 15ms - 25ms | 18ms | Chunked Transfer Encoding |
| Artifact Extraction | Instant (0ms) | < 2ms | Regex Streaming State Machine |
| Client PPTX Compilation | < 800ms | 420ms | Client-side PptxGenJS |

---

## 3. High-Priority Directives

- **State Isolation:** Session conversations are partitioned by unique UUIDs with local persistence fallback.
- **Fail-Safe Rendering:** Code and math blocks employ React Error Boundaries to prevent total page crash if KaTeX or syntax parsers encounter invalid syntax.
- **Responsive Layout:** Side-by-side desktop split pane smoothly collapses into touch-optimized mobile drawers on screens smaller than 900px.

---

## 4. Production Deployment

The unified system deploys natively to Vercel Serverless with zero cold-start bottlenecks on Python backend routes. Run the deployment CLI to sync live updates:

\`\`\`bash
# Build production bundle and deploy
npm --prefix frontend run build
vercel --prod --yes
\`\`\`
`,
};

export default function DocStudio({
  doc: initialDoc = null,
  onClose,
  isSplitView = false,
  onToggleSplitView,
}) {
  const [doc, setDoc] = useState(() => initialDoc || DEFAULT_AI_DOC);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutline, setShowOutline] = useState(true);

  const content = doc.content || "";

  // Extract headings for Table of Contents / Outline
  const outlineItems = useMemo(() => {
    const lines = content.split("\n");
    const items = [];
    lines.forEach((line) => {
      const match = /^(#{1,3})\s+(.*)$/.exec(line);
      if (match) {
        items.push({
          level: match[1].length,
          text: match[2].replace(/[*_`]/g, "").trim(),
          id: match[2].toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        });
      }
    });
    return items;
  }, [content]);

  // Statistics
  const stats = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { words, readingTime };
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(doc.title || "Document").replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`doc-studio-workspace ${isSplitView ? "in-split" : ""}`}>
      {/* Header Toolbar */}
      <div className="doc-studio-header">
        <div className="doc-header-left">
          <div className="doc-icon-badge">
            <FileText size={17} className="text-blue" />
          </div>
          <div className="doc-title-meta">
            <span className="doc-main-title">{doc.title || "Document Artifact"}</span>
            <span className="doc-sub-meta">
              {stats.words} words · ~{stats.readingTime} min read
            </span>
          </div>
        </div>

        <div className="doc-header-right">
          <button
            type="button"
            className={`doc-tool-btn ${showOutline ? "active" : ""}`}
            onClick={() => setShowOutline(!showOutline)}
            title="Toggle outline table of contents"
          >
            <ListTree size={16} />
          </button>

          <button
            type="button"
            className={`doc-tool-btn ${isEditing ? "active" : ""}`}
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? "Switch to preview" : "Edit document"}
          >
            {isEditing ? <Eye size={16} /> : <Edit3 size={16} />}
          </button>

          <div className="doc-header-divider" />

          <button
            type="button"
            className="doc-tool-btn"
            onClick={handleDownloadMd}
            title="Download Markdown (.md)"
          >
            <Download size={16} />
          </button>

          <button
            type="button"
            className="doc-tool-btn"
            onClick={handlePrint}
            title="Print / Export to PDF"
          >
            <Printer size={16} />
          </button>

          <button
            type="button"
            className={`doc-tool-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
            title="Copy document markdown"
          >
            {copied ? <Check size={16} className="text-emerald" /> : <Copy size={16} />}
          </button>

          {onToggleSplitView && (
            <button
              type="button"
              className="doc-tool-btn"
              onClick={onToggleSplitView}
              title={isSplitView ? "Maximize view" : "Split view"}
            >
              {isSplitView ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              className="doc-tool-btn btn-close-doc"
              onClick={onClose}
              title="Close document"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      {/* Main Document Body */}
      <div className="doc-studio-body">
        {/* Left Table of Contents / Outline */}
        {showOutline && outlineItems.length > 0 && (
          <div className="doc-outline-sidebar custom-scrollbar">
            <div className="outline-heading">Contents</div>
            <div className="outline-list">
              {outlineItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`outline-item level-${item.level}`}
                  onClick={() => {
                    const el = document.getElementById(item.id);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <ChevronRight size={12} className="outline-arrow" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Content Canvas */}
        <div className="doc-content-stage custom-scrollbar">
          {isEditing ? (
            <div className="doc-editor-container">
              <textarea
                className="doc-markdown-textarea custom-scrollbar"
                value={content}
                onChange={(e) => setDoc((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your document in Markdown..."
              />
            </div>
          ) : (
            <div className="doc-paper-sheet">
              <div className="doc-markdown-render">
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                  {content}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

