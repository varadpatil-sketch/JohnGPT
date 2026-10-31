import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Archive,
  Copy,
  Code2,
  Briefcase,
  ChevronDown,
  ListFilter,
  Sparkles,
  Layers,
  Pin,
  Edit2,
  Trash2,
  Check,
  X,
  Palette,
  ExternalLink,
  Download,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { generateImage } from "../api";

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onOpenStudio,
  onOpenArtifacts,
  onOpenCode,
  onOpenCreate,
  onOpenChat,
  onOpenCustomInstructions,
  onAttachImageToChat,
  activeMainView = "chat",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isChatsCollapsed, setIsChatsCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("artifacts");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState("");

  // Sidebar Create Section State
  const [isCreateOpen, setIsCreateOpen] = useState(true);
  const [sidebarPrompt, setSidebarPrompt] = useState("");
  const [sidebarStyle, setSidebarStyle] = useState("Photoreal");
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarResult, setSidebarResult] = useState(null);

  const handleSidebarGenerate = async () => {
    if (!sidebarPrompt.trim() || sidebarLoading) return;
    setSidebarLoading(true);
    try {
      const res = await generateImage({
        prompt: sidebarPrompt.trim(),
        style: sidebarStyle,
        aspect_ratio: "1:1",
      });
      setSidebarResult(res);

      try {
        const saved = JSON.parse(localStorage.getItem("johngpt_created_images") || "[]");
        const newEntry = {
          id: Date.now().toString(),
          imageUrl: res.image_url,
          prompt: sidebarPrompt.trim(),
          style: sidebarStyle,
          aspectRatio: "1:1",
          modelUsed: res.model_used,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        localStorage.setItem("johngpt_created_images", JSON.stringify([newEntry, ...saved.slice(0, 20)]));
      } catch {}
    } catch (err) {
      console.error("Sidebar image creation failed:", err);
    } finally {
      setSidebarLoading(false);
    }
  };

  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const startEditing = (sess, e) => {
    e.stopPropagation();
    setEditingSessionId(sess.id);
    setEditTitleInput(sess.title || "New Conversation");
  };

  const saveEditing = (sessionId, e) => {
    if (e) e.stopPropagation();
    if (editTitleInput.trim()) {
      onRenameSession(sessionId, editTitleInput.trim());
    }
    setEditingSessionId(null);
  };

  const cancelEditing = (e) => {
    if (e) e.stopPropagation();
    setEditingSessionId(null);
  };

  const filteredSessions = sessions.filter((s) =>
    (s.title || "New Conversation").toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <aside className="sidebar claude-styled-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-header" onClick={onOpenChat} style={{ cursor: "pointer" }} title="JohnGPT">
        <div className="sidebar-brand-logo-wrap">
          <img src="/logo.png" alt="JohnGPT Logo" className="sidebar-brand-logo" />
        </div>
        <div className="sidebar-brand-info">
          <span className="sidebar-brand-name">JohnGPT</span>
          <span className="sidebar-brand-badge">Gemini 3.5</span>
        </div>
      </div>

      {/* 1. Studio Component Launcher (Above Create Conversation / New) */}
      <div className="sidebar-studio-header-wrap">
        <button
          type="button"
          className={`sidebar-studio-top-box ${activeMainView === "studio" || activeMainView === "code" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("studio");
            if (onOpenStudio) onOpenStudio();
            else if (onOpenCode) onOpenCode();
          }}
          title="Open JohnGPT Studio Workspace (Interactive Sandbox & Apps)"
        >
          <div className="studio-top-icon-glow">
            <Layers size={17} className="text-accent" />
          </div>
          <div className="studio-top-meta">
            <div className="studio-top-title-row">
              <span className="studio-top-title">Studio</span>
              <span className="studio-top-pill">Sandbox</span>
            </div>
            <span className="studio-top-sub">Create web apps & code</span>
          </div>
          <Sparkles size={14} className="studio-top-sparkle text-accent" />
        </button>
      </div>

      {/* 2. Top Primary Navigation List (Exact layout from reference screenshot) */}
      <div className="sidebar-primary-nav">
        {/* + New (Create Conversation) */}
        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === "new" && activeMainView === "chat" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("new");
            if (onOpenChat) onOpenChat();
            onNewSession();
          }}
          title="Start a new conversation"
        >
          <Plus size={18} className="nav-item-icon" />
          <span className="nav-item-label">New</span>
        </button>

        {/* Search */}
        <button
          type="button"
          className={`sidebar-nav-item ${isSearchOpen ? "active" : ""}`}
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          title="Search conversations"
        >
          <Search size={18} className="nav-item-icon" />
          <span className="nav-item-label">Search</span>
        </button>

        {/* Inline Search Bar (Expands smoothly when Search is clicked) */}
        {isSearchOpen && (
          <div className="sidebar-inline-search fade-in scale-in">
            <Search size={13} className="inline-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="inline-search-input"
              placeholder="Filter chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-inline-clear"
                onClick={() => setSearchQuery("")}
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Create (Dedicated Image Generation Studio) */}
        <button
          type="button"
          className={`sidebar-nav-item ${activeMainView === "create" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("create");
            if (onOpenCreate) onOpenCreate();
          }}
          title="Create Images with AI"
        >
          <Palette size={18} className="nav-item-icon text-accent" />
          <span className="nav-item-label">Create</span>
          <span className="nav-upgrade-badge" style={{ background: "rgba(234, 179, 8, 0.15)", color: "#facc15" }}>Images</span>
        </button>

        {/* Studio (Unified Web App & Code Builder) */}
        <button
          type="button"
          className={`sidebar-nav-item ${activeMainView === "studio" || activeMainView === "code" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("studio");
            if (onOpenStudio) onOpenStudio();
            else if (onOpenCode) onOpenCode();
          }}
          title="JohnGPT Studio (Prompt-Driven Web Apps & Codebase Builder)"
        >
          <Code2 size={18} className="nav-item-icon text-accent" />
          <span className="nav-item-label">Studio</span>
          <span className="nav-upgrade-badge">AI Builder</span>
        </button>

        {/* Artifacts (Dedicated Artifacts view) */}
        <button
          type="button"
          className={`sidebar-nav-item ${activeMainView === "artifacts" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("artifacts");
            if (onOpenArtifacts) onOpenArtifacts();
          }}
          title="Saved Artifacts & Templates"
        >
          <Copy size={18} className="nav-item-icon" />
          <span className="nav-item-label">Artifacts</span>
        </button>

        {/* Customize */}
        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === "customize" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("customize");
            if (onOpenCustomInstructions) onOpenCustomInstructions();
          }}
          title="Customize Instructions & Persona"
        >
          <Briefcase size={18} className="nav-item-icon" />
          <span className="nav-item-label">Customize</span>
        </button>
      </div>

      {/* 2.5 Dedicated Sidebar Create Section (Describe and create images directly in the sidebar) */}
      <div className="sidebar-create-section">
        <div
          className="sidebar-create-header"
          onClick={() => setIsCreateOpen(!isCreateOpen)}
          title="Toggle Image Creator"
        >
          <div className="sidebar-create-title-row">
            <Palette size={14} className="text-accent" />
            <span className="sidebar-create-title">Create</span>
            <span className="sidebar-create-badge">Nano Banana</span>
          </div>
          <ChevronDown
            size={13}
            className={`caret-chats-arrow ${!isCreateOpen ? "collapsed" : ""}`}
          />
        </div>

        {isCreateOpen && (
          <div className="sidebar-create-body fade-in">
            <div className="sidebar-create-input-wrap">
              <textarea
                className="sidebar-create-textarea"
                rows={2}
                placeholder="Describe an image to create..."
                value={sidebarPrompt}
                onChange={(e) => setSidebarPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSidebarGenerate();
                  }
                }}
              />
            </div>

            <div className="sidebar-create-styles-row">
              {["Photoreal", "Anime", "Cyberpunk", "3D Art"].map((style) => (
                <button
                  key={style}
                  type="button"
                  className={`sidebar-style-pill ${sidebarStyle === style ? "active" : ""}`}
                  onClick={() => setSidebarStyle(style)}
                >
                  {style}
                </button>
              ))}
            </div>

            <div className="sidebar-create-actions-row">
              <button
                type="button"
                className="btn-sidebar-create-submit"
                disabled={sidebarLoading || !sidebarPrompt.trim()}
                onClick={handleSidebarGenerate}
              >
                {sidebarLoading ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Create</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-sidebar-create-expand"
                onClick={() => {
                  if (onOpenCreate) onOpenCreate();
                }}
                title="Open Full Image Studio"
              >
                <ExternalLink size={12} />
                <span>Studio</span>
              </button>
            </div>

            {/* If an image was created, show thumbnail card in sidebar */}
            {sidebarResult && (
              <div className="sidebar-create-result-card fade-in">
                <img
                  src={sidebarResult.image_url}
                  alt={sidebarResult.prompt}
                  className="sidebar-result-thumb"
                  onClick={() => {
                    if (onOpenCreate) onOpenCreate();
                  }}
                  title="Click to view in Studio"
                />
                <div className="sidebar-result-details">
                  <span className="sidebar-result-prompt" title={sidebarResult.prompt}>
                    {sidebarResult.prompt}
                  </span>
                  <div className="sidebar-result-actions">
                    <button
                      type="button"
                      className="btn-sidebar-thumb-act"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = sidebarResult.image_url;
                        a.download = `johngpt-sidebar-${Date.now()}.jpg`;
                        a.click();
                      }}
                      title="Download image"
                    >
                      <Download size={11} />
                    </button>
                    {onAttachImageToChat && (
                      <button
                        type="button"
                        className="btn-sidebar-thumb-act highlight"
                        onClick={() => {
                          onAttachImageToChat(sidebarResult.image_url, sidebarResult.prompt);
                        }}
                        title="Discuss in Chat"
                      >
                        <MessageSquare size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Section Header: Chats and tasks ▾ */}
      <div className="sidebar-chats-header">
        <button
          type="button"
          className="chats-header-toggle"
          onClick={() => setIsChatsCollapsed(!isChatsCollapsed)}
          title="Toggle conversation list"
        >
          <span className="chats-header-title">Chats and tasks</span>
          <ChevronDown
            size={14}
            className={`caret-chats-arrow ${isChatsCollapsed ? "collapsed" : ""}`}
          />
        </button>

        <button
          type="button"
          className="btn-chats-filter"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          title="Filter or search conversations"
        >
          <ListFilter size={15} />
        </button>
      </div>

      {/* 4. Conversations List (Hollow Bullet Circles `○` Matching Reference Screenshot) */}
      {!isChatsCollapsed && (
        <div className="sidebar-chats-scroll-list">
          {filteredSessions.length === 0 ? (
            <div className="empty-chats-notice">
              {searchQuery ? "No matching chats found" : "No conversations yet"}
            </div>
          ) : (
            <div className="sidebar-hollow-items-col">
              {filteredSessions.map((sess) => {
                const isActive = sess.id === currentSessionId;
                const isEditing = editingSessionId === sess.id;
                const isPinned = Boolean(sess.is_pinned);

                return (
                  <div
                    key={sess.id}
                    className={`sidebar-hollow-chat-row ${isActive ? "active" : ""} ${isPinned ? "pinned" : ""}`}
                    onClick={() => {
                      setActiveNav(null);
                      if (onOpenChat) onOpenChat();
                      onSelectSession(sess.id);
                    }}
                  >
                    {/* Hollow Circle Bullet `○` from reference */}
                    <span className={`chat-hollow-bullet-dot ${isActive ? "active-dot" : ""}`} />

                    {isEditing ? (
                      <input
                        type="text"
                        className="session-inline-edit"
                        value={editTitleInput}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditing(sess.id, e);
                          if (e.key === "Escape") cancelEditing(e);
                        }}
                      />
                    ) : (
                      <span className="sidebar-hollow-chat-text" title={sess.title || "New Conversation"}>
                        {sess.title || "New Conversation"}
                      </span>
                    )}

                    {/* Hover Actions */}
                    <div className="sidebar-hollow-actions" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="btn-hollow-act confirm"
                            onClick={(e) => saveEditing(sess.id, e)}
                            title="Save title"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn-hollow-act cancel"
                            onClick={cancelEditing}
                            title="Cancel"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={`btn-hollow-act ${isPinned ? "is-pinned" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePinSession(sess.id, isPinned);
                            }}
                            title={isPinned ? "Unpin chat" : "Pin chat"}
                          >
                            <Pin size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn-hollow-act"
                            onClick={(e) => startEditing(sess, e)}
                            title="Rename chat"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn-hollow-act danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(sess.id);
                            }}
                            title="Delete chat"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </aside>
  );
}
