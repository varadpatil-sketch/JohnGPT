import React, { useState, useEffect, useRef } from "react";
import {
  Presentation,
  Download,
  Play,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Type,
  Image as ImageIcon,
  Table as TableIcon,
  Palette,
  ChevronDown,
  LayoutGrid,
  FileSpreadsheet,
  FileCode,
  Printer,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  Trash2,
  Copy,
} from "lucide-react";
import { exportDeckToPptx, generateHtmlPresentation } from "../utils/exportPptx";

export const DEFAULT_FOOTBALL_DECK = {
  id: "deck-football",
  title: "Football",
  theme: "forest",
  slides: [
    {
      id: "slide-1",
      layout: "title",
      kicker: "THE BEAUTIFUL GAME",
      title: "Football",
      subtitle: "One ball, two teams, and the world's biggest audience",
      accent: "gold",
      themeVariant: "forest",
    },
    {
      id: "slide-2",
      layout: "stats",
      kicker: "OVERVIEW",
      title: "The game at a glance",
      subtitle: "Simple foundations powering the planet's most watched spectacle",
      themeVariant: "cream",
      stats: [
        { value: "11", label: "Players per side", desc: "Ten outfielders and one designated goalkeeper" },
        { value: "90", label: "Minutes per match", desc: "Two 45-minute halves with continuous running clock" },
        { value: "211", label: "FIFA member nations", desc: "More recognized members than the United Nations" },
      ],
    },
    {
      id: "slide-3",
      layout: "bullets",
      kicker: "THE ESSENTIALS",
      title: "Core rules",
      subtitle: "The foundational laws codified by IFAB that govern the pitch",
      themeVariant: "forest",
      points: [
        { title: "Scoring the Goal", text: "The ball must completely cross the goal line between the posts and under the crossbar." },
        { title: "Hands-Free Play", text: "Only goalkeepers may use hands or arms, strictly inside their own 18-yard penalty area." },
        { title: "The Offside Law", text: "An attacker cannot be closer to the opponent's goal line than the ball and the second-to-last opponent when played." },
        { title: "Disciplinary Cards", text: "Yellow cautions reckless fouls; two yellows or a direct red results in immediate ejection with no substitution." },
      ],
    },
    {
      id: "slide-4",
      layout: "columns",
      kicker: "FORMATION & TACTICS",
      title: "Positions",
      subtitle: "Specialized roles harmonized across modern tactical formations",
      themeVariant: "cream",
      columns: [
        { title: "Goalkeepers", role: "Shot Stopping", desc: "First line of offense and last line of defense. Commands the penalty area." },
        { title: "Defenders", role: "Structure & Cover", desc: "Center-backs protect central danger; full-backs provide width and track wingers." },
        { title: "Midfielders", role: "Engine & Tempo", desc: "Controls possession, transitions defense into attack, and sets game tempo." },
        { title: "Forwards", role: "Finishing & Pressure", desc: "Wingers and strikers responsible for penetrating defenses and scoring." },
      ],
    },
    {
      id: "slide-5",
      layout: "table",
      kicker: "THE PINNACLE",
      title: "The World Cup",
      subtitle: "Quadrennial tournament uniting billions across every continent",
      themeVariant: "forest",
      table: {
        headers: ["Edition", "Host Nation", "Champion", "Global Reach"],
        rows: [
          ["1970", "Mexico", "Brazil (Pelé)", "Pelé's masterclass & first worldwide color broadcast"],
          ["1998", "France", "France (Zidane)", "1.3 billion tuned in worldwide"],
          ["2022", "Qatar", "Argentina (Messi)", "5.4 billion cumulative tournament reach"],
          ["2026", "USA / MEX / CAN", "TBD (Expanded 48 teams)", "Largest single sports event in human history"],
        ],
      },
    },
    {
      id: "slide-6",
      layout: "quote",
      kicker: "GLOBAL IMPACT",
      title: "Simple rules, endless stories",
      subtitle: "A ball, some space, and pure human expression connecting cultures across borders.",
      themeVariant: "gold",
      quote: "Some people believe football is a matter of life and death. I can assure you it is much, much more important than that.",
      author: "Bill Shankly",
    },
  ],
};

const THEMES = [
  { id: "forest", name: "Forest Green Editorial", color: "#0d2818", kicker: "#d4af37" },
  { id: "cream", name: "Cream Executive", color: "#f7f4ea", kicker: "#8c6d1f" },
  { id: "gold", name: "Warm Mustard Gold", color: "#d8ae5e", kicker: "#5f370e" },
  { id: "obsidian", name: "Obsidian Dark Noir", color: "#0b0f19", kicker: "#38bdf8" },
  { id: "indigo", name: "Sapphire Tech", color: "#1e1b4b", kicker: "#a855f7" },
];

export default function SlideStudio({
  deck: initialDeck = null,
  onClose,
  isSplitView = false,
  onToggleSplitView,
}) {
  const [deck, setDeck] = useState(() => initialDeck || DEFAULT_FOOTBALL_DECK);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState("slide"); // "slide" | "grid"
  const [zoomLevel, setZoomLevel] = useState("fit"); // "fit", "50%", "75%", "100%"
  const [isPlaying, setIsPlaying] = useState(false);
  const [presentationTimer, setPresentationTimer] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAddSlideMenu, setShowAddSlideMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(deck.title || "Football");

  // Keep internal deck in sync if prop changes
  useEffect(() => {
    if (initialDeck) {
      setDeck(initialDeck);
      setTitleInput(initialDeck.title || "Presentation");
      setActiveSlideIndex(0);
    }
  }, [initialDeck]);

  const activeSlide = deck.slides[activeSlideIndex] || deck.slides[0];

  // Presentation Timer
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPresentationTimer((t) => t + 1);
      }, 1000);
    } else {
      setPresentationTimer(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Keyboard navigation for slides
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setActiveSlideIndex((idx) => Math.min(idx + 1, deck.slides.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setActiveSlideIndex((idx) => Math.max(idx - 1, 0));
      } else if (e.key === "Escape" && isPlaying) {
        setIsPlaying(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deck.slides.length, isPlaying]);

  const handleNextSlide = () => {
    setActiveSlideIndex((idx) => Math.min(idx + 1, deck.slides.length - 1));
  };

  const handlePrevSlide = () => {
    setActiveSlideIndex((idx) => Math.max(idx - 1, 0));
  };

  const handleExportPptx = async () => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      await exportDeckToPptx(deck);
    } catch (err) {
      console.error("Export to PPTX failed:", err);
      alert("Failed to export PowerPoint file: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHtml = () => {
    setShowExportMenu(false);
    try {
      const html = generateHtmlPresentation(deck);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(deck.title || "Presentation").replace(/[^a-zA-Z0-9_-]/g, "_")}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export to HTML failed:", err);
    }
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      setDeck((prev) => ({ ...prev, title: titleInput.trim() }));
    }
    setIsEditingTitle(false);
  };

  const handleChangeTheme = (themeId) => {
    setDeck((prev) => ({
      ...prev,
      theme: themeId,
      slides: prev.slides.map((s) => ({ ...s, themeVariant: themeId })),
    }));
    setShowThemeMenu(false);
  };

  const handleAddSlide = (layout) => {
    setShowAddSlideMenu(false);
    const newSlideId = `slide-${Date.now()}`;
    let newSlide = {
      id: newSlideId,
      layout,
      kicker: "NEW SECTION",
      title: "New Slide Title",
      subtitle: "Add descriptive subtitle or summary here",
      themeVariant: deck.theme || "forest",
    };

    if (layout === "stats") {
      newSlide.stats = [
        { value: "100%", label: "Target Metric", desc: "Key highlight" },
        { value: "24/7", label: "Availability", desc: "Continuous uptime" },
        { value: "5x", label: "Performance", desc: "Acceleration gain" },
      ];
    } else if (layout === "bullets") {
      newSlide.points = [
        { title: "First Point", text: "Detailed explanation of this core rule or concept." },
        { title: "Second Point", text: "Supporting evidence and practical application." },
        { title: "Third Point", text: "Strategic consideration or critical requirement." },
      ];
    } else if (layout === "columns") {
      newSlide.columns = [
        { title: "Phase 1", role: "Discovery", desc: "Research and baseline definition." },
        { title: "Phase 2", role: "Design", desc: "Architecture and technical validation." },
        { title: "Phase 3", role: "Launch", desc: "Execution and iterative delivery." },
      ];
    } else if (layout === "quote") {
      newSlide.quote = "Simplicity is the prerequisite for reliability.";
      newSlide.author = "Edsger W. Dijkstra";
    }

    setDeck((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setActiveSlideIndex(deck.slides.length);
  };

  const handleDeleteSlide = (index, e) => {
    e.stopPropagation();
    if (deck.slides.length <= 1) return;
    setDeck((prev) => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index),
    }));
    setActiveSlideIndex((prev) => Math.max(0, Math.min(prev, deck.slides.length - 2)));
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`slide-studio-workspace ${isPlaying ? "presenter-mode" : ""} ${isSplitView ? "in-split" : ""}`}>
      {/* 1. Header Toolbar (Identical to Claude's Slides artifact header) */}
      <div className="slide-studio-header">
        <div className="slide-header-left">
          {/* Deck Title Dropdown / Rename */}
          <div className="slide-deck-title-group">
            {isEditingTitle ? (
              <div className="title-edit-box">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  autoFocus
                  className="slide-title-input"
                />
                <button type="button" className="btn-icon-check" onClick={handleSaveTitle}>
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="slide-deck-title-btn"
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename deck"
              >
                <Presentation size={17} className="slide-deck-icon" />
                <span className="deck-title-text">{deck.title || "Football"}</span>
                <ChevronDown size={14} className="title-caret" />
              </button>
            )}
          </div>

          <div className="slide-header-divider" />

          {/* Quick Tools: [T], Image, Table, Theme */}
          <div className="slide-tools-group">
            <button
              type="button"
              className="slide-tool-btn"
              title="Add text slide"
              onClick={() => handleAddSlide("bullets")}
            >
              <Type size={16} />
            </button>
            <button
              type="button"
              className="slide-tool-btn"
              title="Add multi-column cards"
              onClick={() => handleAddSlide("columns")}
            >
              <ImageIcon size={16} />
            </button>
            <button
              type="button"
              className="slide-tool-btn"
              title="Add data table slide"
              onClick={() => handleAddSlide("table")}
            >
              <TableIcon size={16} />
            </button>
            <div className="relative-menu-anchor">
              <button
                type="button"
                className="slide-tool-btn"
                title="Change theme palette"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
              >
                <Palette size={16} />
              </button>
              {showThemeMenu && (
                <div className="slide-dropdown-popover theme-popover fade-in">
                  <div className="popover-title">Select Color Theme</div>
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      className={`theme-option-row ${(deck.theme || "forest") === th.id ? "active" : ""}`}
                      onClick={() => handleChangeTheme(th.id)}
                    >
                      <span className="theme-color-chip" style={{ background: th.color }} />
                      <span className="theme-name">{th.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Actions: Export, Play, Split Toggle, Zoom, Close */}
        <div className="slide-header-right">
          {/* Export Dropdown Button */}
          <div className="relative-menu-anchor">
            <button
              type="button"
              className={`slide-btn-export ${isExporting ? "loading" : ""}`}
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export presentation"
              disabled={isExporting}
            >
              <Download size={14} />
              <span>{isExporting ? "Generating..." : "Export"}</span>
              <ChevronDown size={12} />
            </button>

            {showExportMenu && (
              <div className="slide-dropdown-popover export-popover fade-in">
                <button type="button" className="popover-action-row" onClick={handleExportPptx}>
                  <FileSpreadsheet size={16} className="text-orange" />
                  <div className="action-text-col">
                    <span className="action-title">PowerPoint (.pptx)</span>
                    <span className="action-sub">True 16:9 Microsoft PowerPoint file</span>
                  </div>
                </button>
                <button type="button" className="popover-action-row" onClick={handleExportHtml}>
                  <FileCode size={16} className="text-teal" />
                  <div className="action-text-col">
                    <span className="action-title">HTML Presentation</span>
                    <span className="action-sub">Interactive offline browser slideshow</span>
                  </div>
                </button>
                <button type="button" className="popover-action-row" onClick={handlePrint}>
                  <Printer size={16} className="text-purple" />
                  <div className="action-text-col">
                    <span className="action-title">Print / PDF Slides</span>
                    <span className="action-sub">Standard presentation landscape sheets</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Quick Direct PPTX Download Button */}
          <button
            type="button"
            className="slide-icon-btn"
            onClick={handleExportPptx}
            title="Download PowerPoint PPTX"
          >
            <Download size={16} />
          </button>

          {/* Present / Play Button */}
          <button
            type="button"
            className="slide-icon-btn btn-play-slideshow"
            onClick={() => setIsPlaying(true)}
            title="Start full-screen presentation (F5 / Space)"
          >
            <Play size={15} fill="currentColor" />
          </button>

          {/* Zoom Selector */}
          <div className="slide-zoom-selector">
            <select
              value={zoomLevel}
              onChange={(e) => setZoomLevel(e.target.value)}
              className="zoom-select-input"
              aria-label="Slide zoom level"
            >
              <option value="fit">Fit</option>
              <option value="50%">50%</option>
              <option value="75%">75%</option>
              <option value="100%">100%</option>
            </select>
          </div>

          {/* Split / Fullscreen Toggle */}
          {onToggleSplitView && (
            <button
              type="button"
              className="slide-icon-btn"
              onClick={onToggleSplitView}
              title={isSplitView ? "Maximize presentation" : "Side-by-side split screen"}
            >
              {isSplitView ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          )}

          {/* Close Studio Button */}
          {onClose && (
            <button
              type="button"
              className="slide-icon-btn btn-close-slides"
              onClick={onClose}
              title="Close slides and return to chat"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Slide Presentation Stage (16:9 Canvas) */}
      <div className={`slide-viewport-area ${viewMode === "grid" ? "grid-mode" : ""}`}>
        {viewMode === "grid" ? (
          /* Grid View of all slides */
          <div className="slides-grid-overview custom-scrollbar">
            {deck.slides.map((s, idx) => {
              const theme = s.themeVariant || deck.theme || "forest";
              return (
                <div
                  key={s.id || idx}
                  className={`grid-slide-card theme-${theme} ${idx === activeSlideIndex ? "active-ring" : ""}`}
                  onClick={() => {
                    setActiveSlideIndex(idx);
                    setViewMode("slide");
                  }}
                >
                  <div className="grid-slide-badge">{idx + 1}</div>
                  <div className="grid-slide-content">
                    {s.kicker && <div className="grid-kicker">{s.kicker}</div>}
                    <div className="grid-title">{s.title}</div>
                    {s.subtitle && <div className="grid-sub">{s.subtitle}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single 16:9 Slide Canvas */
          <div className="slide-stage-wrapper">
            <div
              className={`slide-canvas-169 theme-${activeSlide.themeVariant || deck.theme || "forest"} zoom-${zoomLevel}`}
            >
              {/* Slide Kicker */}
              {activeSlide.kicker && <div className="slide-kicker-tag">{activeSlide.kicker}</div>}

              {/* Slide Main Heading */}
              <h1 className="slide-headline">{activeSlide.title}</h1>

              {/* Slide Subtitle */}
              {activeSlide.subtitle && <p className="slide-subhead">{activeSlide.subtitle}</p>}

              {/* Dynamic Layout Content */}
              {activeSlide.layout === "stats" && activeSlide.stats && (
                <div className="slide-stats-container">
                  {activeSlide.stats.map((st, i) => (
                    <div key={i} className="slide-kpi-card">
                      <div className="kpi-number">{st.value}</div>
                      <div className="kpi-label">{st.label}</div>
                      <div className="kpi-desc">{st.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeSlide.layout === "bullets" && activeSlide.points && (
                <div className="slide-bullets-container">
                  {activeSlide.points.map((pt, i) => (
                    <div key={i} className="slide-bullet-row">
                      <div className="bullet-badge-num">{i + 1}</div>
                      <div className="bullet-text-col">
                        <span className="bullet-bold">{typeof pt === "string" ? pt : pt.title}</span>
                        {typeof pt === "object" && pt.text && (
                          <span className="bullet-desc"> — {pt.text}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSlide.layout === "columns" && activeSlide.columns && (
                <div className="slide-columns-container">
                  {activeSlide.columns.map((col, i) => (
                    <div key={i} className="slide-col-card">
                      <h3 className="col-headline">{col.title}</h3>
                      {col.role && <div className="col-role-pill">{col.role}</div>}
                      <p className="col-body">{col.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeSlide.layout === "table" && activeSlide.table && (
                <div className="slide-table-container">
                  <table className="slide-table-element">
                    <thead>
                      <tr>
                        {activeSlide.table.headers.map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeSlide.table.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeSlide.layout === "quote" && (
                <div className="slide-quote-container">
                  <blockquote className="slide-quote-text">
                    “{activeSlide.quote || activeSlide.subtitle}”
                  </blockquote>
                  {activeSlide.author && (
                    <div className="slide-quote-author">— {activeSlide.author}</div>
                  )}
                </div>
              )}

              {/* Slide Number in bottom left corner (exact Claude match) */}
              <div className="slide-corner-badge">{activeSlideIndex + 1}</div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Filmstrip Carousel (Exact match to Claude's screenshot) */}
      <div className="slide-filmstrip-bar">
        {/* Add Slide (+) & Layout tools */}
        <div className="filmstrip-left-controls">
          <div className="relative-menu-anchor">
            <button
              type="button"
              className="btn-filmstrip-add"
              onClick={() => setShowAddSlideMenu(!showAddSlideMenu)}
              title="Add a new slide"
            >
              <Plus size={18} />
            </button>

            {showAddSlideMenu && (
              <div className="slide-dropdown-popover add-slide-popover fade-in">
                <div className="popover-title">Choose Slide Layout</div>
                <button type="button" className="popover-action-row" onClick={() => handleAddSlide("title")}>
                  <Type size={16} />
                  <span>Title / Hero Slide</span>
                </button>
                <button type="button" className="popover-action-row" onClick={() => handleAddSlide("stats")}>
                  <LayoutGrid size={16} />
                  <span>Stats & Metrics (3 KPIs)</span>
                </button>
                <button type="button" className="popover-action-row" onClick={() => handleAddSlide("bullets")}>
                  <Presentation size={16} />
                  <span>Core Rules / Key Points</span>
                </button>
                <button type="button" className="popover-action-row" onClick={() => handleAddSlide("columns")}>
                  <ImageIcon size={16} />
                  <span>4-Column Cards (Positions)</span>
                </button>
                <button type="button" className="popover-action-row" onClick={() => handleAddSlide("table")}>
                  <TableIcon size={16} />
                  <span>Data Table / Timeline</span>
                </button>
                <button type="button" className="popover-action-row" onClick={() => handleAddSlide("quote")}>
                  <Type size={16} />
                  <span>Closing Quote / Big Statement</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Horizontal Thumbnail Carousel */}
        <div className="filmstrip-cards-track custom-scrollbar">
          {deck.slides.map((s, idx) => {
            const theme = s.themeVariant || deck.theme || "forest";
            const isActive = idx === activeSlideIndex;
            return (
              <div
                key={s.id || idx}
                className={`filmstrip-thumbnail theme-${theme} ${isActive ? "active-slide" : ""}`}
                onClick={() => {
                  setActiveSlideIndex(idx);
                  setViewMode("slide");
                }}
                role="button"
                tabIndex={0}
                title={`Slide ${idx + 1}: ${s.title}`}
              >
                {/* Miniature slide contents */}
                <div className="mini-slide-render">
                  <div className="mini-title">{s.title}</div>
                  {s.layout === "stats" && (
                    <div className="mini-stats-dots">
                      <span>11</span>
                      <span>90</span>
                      <span>211</span>
                    </div>
                  )}
                  {s.layout === "bullets" && (
                    <div className="mini-lines">
                      <div className="mini-line" />
                      <div className="mini-line" />
                    </div>
                  )}
                  {s.layout === "columns" && (
                    <div className="mini-cols">
                      <div className="mini-col" />
                      <div className="mini-col" />
                      <div className="mini-col" />
                      <div className="mini-col" />
                    </div>
                  )}
                </div>

                {/* Number Badge in bottom-left corner */}
                <div className="filmstrip-slide-num">{idx + 1}</div>
              </div>
            );
          })}
        </div>

        {/* Right Layout View Toggles (Slide View vs Grid View) */}
        <div className="filmstrip-right-controls">
          <button
            type="button"
            className={`filmstrip-view-btn ${viewMode === "slide" ? "active" : ""}`}
            onClick={() => setViewMode("slide")}
            title="Single Slide Canvas View"
          >
            <Presentation size={16} />
          </button>
          <button
            type="button"
            className={`filmstrip-view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid Overview of all slides"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* 4. Fullscreen Presentation Slideshow Overlay */}
      {isPlaying && (
        <div className="slideshow-fullscreen-overlay">
          <div className="slideshow-content-stage">
            <div
              className={`slide-canvas-169 theme-${activeSlide.themeVariant || deck.theme || "forest"} in-presentation`}
            >
              {activeSlide.kicker && <div className="slide-kicker-tag">{activeSlide.kicker}</div>}
              <h1 className="slide-headline">{activeSlide.title}</h1>
              {activeSlide.subtitle && <p className="slide-subhead">{activeSlide.subtitle}</p>}

              {activeSlide.layout === "stats" && activeSlide.stats && (
                <div className="slide-stats-container">
                  {activeSlide.stats.map((st, i) => (
                    <div key={i} className="slide-kpi-card">
                      <div className="kpi-number">{st.value}</div>
                      <div className="kpi-label">{st.label}</div>
                      <div className="kpi-desc">{st.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeSlide.layout === "bullets" && activeSlide.points && (
                <div className="slide-bullets-container">
                  {activeSlide.points.map((pt, i) => (
                    <div key={i} className="slide-bullet-row">
                      <div className="bullet-badge-num">{i + 1}</div>
                      <div className="bullet-text-col">
                        <span className="bullet-bold">{typeof pt === "string" ? pt : pt.title}</span>
                        {typeof pt === "object" && pt.text && (
                          <span className="bullet-desc"> — {pt.text}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSlide.layout === "columns" && activeSlide.columns && (
                <div className="slide-columns-container">
                  {activeSlide.columns.map((col, i) => (
                    <div key={i} className="slide-col-card">
                      <h3 className="col-headline">{col.title}</h3>
                      {col.role && <div className="col-role-pill">{col.role}</div>}
                      <p className="col-body">{col.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeSlide.layout === "quote" && (
                <div className="slide-quote-container">
                  <blockquote className="slide-quote-text">
                    “{activeSlide.quote || activeSlide.subtitle}”
                  </blockquote>
                  {activeSlide.author && (
                    <div className="slide-quote-author">— {activeSlide.author}</div>
                  )}
                </div>
              )}

              <div className="slide-corner-badge">{activeSlideIndex + 1}</div>
            </div>
          </div>

          {/* Floating Controls Bar at Bottom */}
          <div className="slideshow-hud-pill">
            <button
              type="button"
              className="hud-btn"
              onClick={handlePrevSlide}
              disabled={activeSlideIndex === 0}
              title="Previous slide (Left Arrow)"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="hud-slide-counter">
              Slide {activeSlideIndex + 1} of {deck.slides.length}
            </span>
            <span className="hud-timer">{formatTimer(presentationTimer)}</span>
            <button
              type="button"
              className="hud-btn"
              onClick={handleNextSlide}
              disabled={activeSlideIndex === deck.slides.length - 1}
              title="Next slide (Right Arrow)"
            >
              <ChevronRight size={18} />
            </button>
            <div className="hud-divider" />
            <button
              type="button"
              className="hud-btn btn-exit-hud"
              onClick={() => setIsPlaying(false)}
              title="Exit presentation (Esc)"
            >
              <X size={16} />
              <span>Exit</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

