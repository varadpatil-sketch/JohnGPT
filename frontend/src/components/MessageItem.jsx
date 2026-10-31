import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  Bot,
  User,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  RotateCcw,
  Eye,
  Sparkles,
  Volume2,
  VolumeX,
  Layers,
  Play,
  Pause,
} from "lucide-react";
import { speakText, stopSpeaking } from "../utils/voice";
import ThinkingIndicator from "./ThinkingIndicator";

class MessageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn("Message markdown render error, falling back to raw text:", error);
  }
  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.fallbackText !== this.props.fallbackText) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="markdown-raw-fallback" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {this.props.fallbackText || ""}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function MessageItem({
  message,
  messageIndex,
  onRegenerate,
  onEditMessage,
  onViewCitation,
  onContinueGenerating,
  loading,
  onOpenStudio,
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  useEffect(() => {
    setEditContent(message.content || "");
  }, [message.content]);

  const handleToggleSpeech = () => {
    if (isPlayingSpeech) {
      stopSpeaking();
      setIsPlayingSpeech(false);
    } else {
      setIsPlayingSpeech(true);
      speakText(message.content, {
        onEnd: () => setIsPlayingSpeech(false),
        onError: () => setIsPlayingSpeech(false),
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    setIsEditing(false);
    if (onEditMessage) {
      onEditMessage(messageIndex, editContent.trim());
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content || "");
    setIsEditing(false);
  };

  const hasSources = message.sources && message.sources.length > 0;

  return (
    <div className={`message-row ${isUser ? "user" : "assistant"} fade-in`}>
      <div className="message-avatar">
        {isUser ? <User size={18} /> : <img src="/logo.png" alt="JohnGPT" className="message-bot-logo" />}
      </div>

      <div className="message-content-wrapper">
        <div className="message-header">
          <span className="message-sender">{isUser ? "You" : "JohnGPT"}</span>
          <span className="message-time">{message.timestamp || "Just now"}</span>
        </div>

        <div className="message-bubble">
          {message.image && (
            <div className="message-image-container">
              <img src={message.image} alt="Attached visual" className="message-image-preview" />
            </div>
          )}

          {isUser ? (
            isEditing ? (
              <div className="message-edit-box">
                <textarea
                  className="message-edit-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    } else if (e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                  rows={Math.min(6, Math.max(2, editContent.split("\n").length))}
                  autoFocus
                />
                <div className="message-edit-actions">
                  <button className="btn-edit-cancel" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button className="btn-edit-save" onClick={handleSaveEdit}>
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <p className="user-text">{message.content}</p>
            )
          ) : (
            <div className="markdown-content">
              {message.content ? (
                <>
                  <MessageErrorBoundary fallbackText={message.content}>
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          const lang = match ? match[1].toLowerCase() : "";
                          const codeString = String(children).replace(/\n$/, "");

                          const isInteractive =
                            !inline &&
                            (lang === "html" ||
                              lang === "svg" ||
                              (lang === "javascript" && (codeString.includes("document.") || codeString.includes("addEventListener") || codeString.includes("canvas"))) ||
                              codeString.includes("<!DOCTYPE html>") ||
                              codeString.includes("<html"));

                          if (isInteractive) {
                            let title = "Interactive Web App";
                            const titleMatch = /<title>(.*?)<\/title>/i.exec(codeString);
                            if (titleMatch && titleMatch[1]) {
                              title = titleMatch[1].trim();
                            } else if (lang === "svg") {
                              title = "Vector Diagram";
                            }

                            const artifact = {
                              id: `art-${messageIndex}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                              title,
                              type: lang === "svg" ? "diagram" : "app",
                              language: lang || "html",
                              code: codeString,
                              createdAt: Date.now(),
                            };

                            return (
                              <div className="studio-artifact-inline-card fade-in">
                                <div className="studio-inline-banner">
                                  <div className="studio-banner-left">
                                    <div className="studio-banner-icon">
                                      <Layers size={16} />
                                    </div>
                                    <div className="studio-banner-meta">
                                      <span className="studio-banner-title">{title}</span>
                                      <span className="studio-banner-sub">
                                        Studio Workspace • {lang.toUpperCase() || "HTML"} Sandbox Ready
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn-open-in-studio"
                                    onClick={() => onOpenStudio && onOpenStudio(artifact)}
                                    title="Open and run this app in Studio Workspace"
                                  >
                                    <Play size={13} fill="currentColor" />
                                    <span>Open in Studio</span>
                                  </button>
                                </div>
                                <pre className="studio-code-preview">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            );
                          }

                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content
                        ? message.content
                            .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$\n${math.trim()}\n$$`)
                            .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`)
                        : ""}
                    </ReactMarkdown>
                  </MessageErrorBoundary>
                  {message.isStreaming && <span className="streaming-cursor" />}
                  {message.isStopped && !message.isStreaming && (
                    <div className="stopped-indicator-tag">
                      <Pause size={10} />
                      <span>Generation paused</span>
                    </div>
                  )}
                </>
              ) : (
                <ThinkingIndicator />
              )}
            </div>
          )}
        </div>

        {hasSources && (
          <div className="sources-container">
            <button
              className="sources-toggle-btn"
              onClick={() => setShowSources(!showSources)}
            >
              <FileText size={14} />
              <span>
                {message.sources.length} Cited Source{message.sources.length > 1 ? "s" : ""}
              </span>
              {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showSources && (
              <div className="sources-list fade-in">
                {message.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="source-card interactive-source-card"
                    onClick={() => onViewCitation && onViewCitation(src)}
                    title="Click to inspect this document in side-by-side viewer"
                  >
                    <div className="source-header">
                      <span className="source-doc" title={src.filename || src.document_id}>
                        📄 {src.filename || `Doc: ${src.document_id}`}
                      </span>
                      <div className="source-header-right">
                        <span className="source-page">Page {src.page}</span>
                        {src.score && (
                          <span className="source-score" title="Reciprocal Rank Fusion Relevance Score">
                            <Sparkles size={10} />
                            {(src.score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="source-excerpt">"{src.text}"</p>
                    <div className="source-card-footer">
                      <span className="source-type-pill">{src.search_type || "Hybrid RAG"}</span>
                      <span className="source-inspect-link">
                        <Eye size={12} />
                        <span>Inspect Page</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isUser && !isEditing && (
          <div className="message-actions user-actions">
            <button
              className="action-btn"
              onClick={() => {
                setEditContent(message.content || "");
                setIsEditing(true);
              }}
              disabled={loading}
              title="Edit message & regenerate response"
            >
              <Pencil size={12} />
              <span>Edit</span>
            </button>
          </div>
        )}

        {!isUser && (
          <div className="message-actions">
            {message.isStopped && !loading && (
              <button
                className="action-btn btn-continue-action"
                onClick={() => onContinueGenerating && onContinueGenerating(messageIndex)}
                title="Continue generating response from where it stopped"
              >
                <Play size={12} fill="currentColor" />
                <span>Continue</span>
              </button>
            )}

            {!message.isStreaming && message.content && (
              <button
                className={`action-btn ${isPlayingSpeech ? "active-speech" : ""}`}
                onClick={handleToggleSpeech}
                title={isPlayingSpeech ? "Stop speaking" : "Read aloud"}
              >
                {isPlayingSpeech ? <VolumeX size={13} className="text-accent" /> : <Volume2 size={13} />}
                <span>{isPlayingSpeech ? "Stop" : "Read Aloud"}</span>
              </button>
            )}

            <button className="action-btn" onClick={handleCopy} title="Copy response">
              {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            {!message.isStreaming && message.content && (
              <button
                className="action-btn"
                onClick={() => onRegenerate && onRegenerate(messageIndex)}
                disabled={loading}
                title="Regenerate this response"
              >
                <RotateCcw size={12} />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

