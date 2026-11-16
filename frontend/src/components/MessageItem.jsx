import React, { useState, useEffect, useMemo, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
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
  Presentation,
} from "lucide-react";
import { speakText, stopSpeaking } from "../utils/voice";
import ThinkingIndicator from "./ThinkingIndicator";
import GrokCodeBlock from "./GrokCodeBlock";

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

/**
 * Preprocess markdown content to properly handle LaTeX math equations,
 * HTML collapsible details/summary elements, and prevent dollar currency
 * from accidentally triggering KaTeX math mode.
 */
function preprocessMarkdown(content) {
  if (!content) return "";
  let text = content;

  // 0. Temporarily protect code blocks from math / currency substitutions
  const codeBlocks = [];
  text = text.replace(/(```[\s\S]*?(?:```|$))/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 1. Convert display/inline LaTeX brackets \[ \] and \( \)
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$\n${math.trim()}\n$$`);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 2. Fix Gemini's mangled currency outputs (e.g. $\\$80$, $\\80$, $\$$80$ -> \$80)
  text = text.replace(/\$\s*\\+\$?\s*([0-9]+(?:\.[0-9]+)?)\s*\$/g, (_, num) => `\\$${num}`);
  text = text.replace(/\$\s*\\+([0-9]+(?:\.[0-9]+)?)\s*\$/g, (_, num) => `\\$${num}`);
  text = text.replace(/\*\*\s*\$?\s*\\+\$?\s*([0-9]+(?:\.[0-9]+)?)\s*\$?\s*\*\*/g, (_, num) => `**\\$${num}**`);
  text = text.replace(/\$\s*\\+([0-9]+(?:\.[0-9]+)?)\s+([a-zA-Z][^$]*?)\$/g, (_, num, rest) => `\\$${num} ${rest}`);
  text = text.replace(/(^|[\s(])\\+([0-9]+(?:\.[0-9]+)?)(?=[\s.,!?;:)]|$)/g, (_, pre, num) => `${pre}\\$${num}`);
  text = text.replace(/(?<!\\)\\+\$([0-9]+(?:\.[0-9]+)?)/g, (_, num) => `\\$${num}`);

  // 3. Temporarily protect block math ($$...$$)
  const mathBlocks = [];
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    mathBlocks.push(match);
    return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
  });

  // 4. Temporarily protect real inline math ($...$)
  const inlineMath = [];
  text = text.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (match, inner) => {
    const trimmed = inner.trim();
    // Bare number or single currency like "80", "\$80", "60" -> not an equation
    if (/^\\?\$?[0-9]+(?:\.[0-9]+)?$/.test(trimmed)) {
      return `\\$${trimmed.replace(/^\\?\$?/, "")}`;
    }
    // Accidental split ending with operator: e.g. "80 = ", "80 - " -> currency expression
    if (/^[0-9.,]+\s*[=+\-*/]\s*$/.test(trimmed)) {
      const op = trimmed.replace(/^[0-9.,]+\s*/, "").trim();
      const num = trimmed.replace(/\s*[=+\-*/]\s*$/, "").trim();
      return `\\$${num} ${op} \\$`;
    }
    // Real math (has LaTeX commands, operators, or variables)
    if (/[a-zA-Z]|\\[a-zA-Z]+|[=+\-*/^_{}]/.test(trimmed)) {
      inlineMath.push(match);
      return `__INLINE_MATH_${inlineMath.length - 1}__`;
    }
    return match;
  });

  // 5. Any remaining '$' followed by digits (like $80, $20, $60, or trailing $60$) is currency
  text = text.replace(/(?<!\\)\$([0-9]+(?:\.[0-9]+)?)\$?/g, (_, num) => `\\$${num}`);

  // 6. Restore protected inline & block math
  text = text.replace(/__INLINE_MATH_(\d+)__/g, (_, idx) => inlineMath[Number(idx)]);
  text = text.replace(/__MATH_BLOCK_(\d+)__/g, (_, idx) => mathBlocks[Number(idx)]);

  // 7. Ensure details and summary tags have clean separation for ReactMarkdown
  text = text.replace(/(<\/?details[^>]*>)/gi, "\n\n$1\n\n");
  text = text.replace(/(<\/?summary[^>]*>)/gi, "\n$1\n");

  // 8. Restore protected code blocks
  text = text.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)]);

  return text;
}

function MessageItem({
  message,
  messageIndex,
  onRegenerate,
  onEditMessage,
  onViewCitation,
  onContinueGenerating,
  loading,
  onOpenStudio,
  onOpenSlideDeck,
  onOpenArtifact,
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

  // Memoize markdown preprocessing so regexes don't re-run unnecessarily
  const preprocessedMarkdown = useMemo(
    () => preprocessMarkdown(message.content),
    [message.content]
  );

  // Stable markdown components definition to prevent unmounting/remounting code cards on keystrokes
  const markdownComponents = useMemo(
    () => ({
      pre({ children }) {
        return <>{children}</>;
      },
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const lang = match ? match[1].toLowerCase() : "";
        const codeString = String(children).replace(/\n$/, "");
        const isInline = inline || (!match && !codeString.includes("\n"));

        if (isInline) {
          return (
            <code className="grok-inline-code" {...props}>
              {children}
            </code>
          );
        }

        // 1. Check for interactive Slides artifact deck
        if (
          lang === "slides" ||
          (lang === "json" &&
            codeString.includes('"slides"') &&
            (codeString.includes('"layout"') || codeString.includes('"kicker"')))
        ) {
          let deckData = null;
          try {
            deckData = JSON.parse(codeString);
          } catch (e) {
            // might be streaming or partial JSON
          }
          if (deckData && Array.isArray(deckData.slides)) {
            return (
              <div
                className="claude-artifact-card slides-card fade-in"
                onClick={() => {
                  if (onOpenArtifact) {
                    onOpenArtifact({
                      type: "slides",
                      title: deckData.title || "Interactive Presentation",
                      data: deckData,
                    });
                  } else if (onOpenSlideDeck) {
                    onOpenSlideDeck(deckData);
                  }
                }}
                role="button"
                tabIndex={0}
                title="Click to open presentation in interactive Slide Studio"
              >
                <div className="claude-artifact-icon-box">
                  <Presentation size={20} className="slides-artifact-icon" />
                </div>
                <div className="claude-artifact-details">
                  <div className="claude-artifact-title">{deckData.title || "Interactive Presentation"}</div>
                  <div className="claude-artifact-meta">
                    JohnGPT Slides · {deckData.slides.length} Slides
                  </div>
                </div>
                <div className="claude-artifact-badge-open">
                  <span>Open Deck</span>
                  <Play size={11} fill="currentColor" />
                </div>
              </div>
            );
          }
        }

        // 2. Check for interactive Document artifact
        if (lang === "doc" || lang === "document") {
          const docTitle = "Technical Documentation";
          return (
            <div
              className="claude-artifact-card doc-card fade-in"
              onClick={() =>
                onOpenArtifact &&
                onOpenArtifact({
                  type: "doc",
                  title: docTitle,
                  data: { title: docTitle, content: codeString },
                })
              }
              role="button"
              tabIndex={0}
              title="Click to open document in interactive Doc Studio"
            >
              <div className="claude-artifact-icon-box" style={{ background: "rgba(59, 130, 246, 0.16)", borderColor: "rgba(59, 130, 246, 0.35)", color: "#3b82f6" }}>
                <FileText size={20} />
              </div>
              <div className="claude-artifact-details">
                <div className="claude-artifact-title">{docTitle}</div>
                <div className="claude-artifact-meta">JohnGPT Docs · Formatted Specification</div>
              </div>
              <div className="claude-artifact-badge-open" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.3)" }}>
                <span>Open Doc</span>
                <Play size={11} fill="currentColor" />
              </div>
            </div>
          );
        }

        const isInteractive =
          lang === "html" ||
          lang === "svg" ||
          (lang === "javascript" &&
            (codeString.includes("document.") ||
              codeString.includes("addEventListener") ||
              codeString.includes("canvas"))) ||
          codeString.includes("<!DOCTYPE html>") ||
          codeString.includes("<html");

        let artifact = null;
        if (isInteractive) {
          let title = "Interactive Web App";
          const titleMatch = /<title>(.*?)<\/title>/i.exec(codeString);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
          } else if (lang === "svg") {
            title = "Vector Diagram";
          }

          artifact = {
            id: `art-${messageIndex}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            title,
            type: lang === "svg" ? "diagram" : "app",
            language: lang || "html",
            code: codeString,
            createdAt: Date.now(),
          };
        }

        return (
          <GrokCodeBlock
            language={lang}
            code={codeString}
            isInteractive={isInteractive}
            artifact={artifact}
            onOpenStudio={(art) => {
              if (onOpenArtifact && art && (art.type === "app" || art.type === "diagram")) {
                onOpenArtifact(art);
              } else if (onOpenStudio) {
                onOpenStudio(art);
              }
            }}
          />
        );
      },
    }),
    [messageIndex, onOpenStudio, onOpenSlideDeck, onOpenArtifact]
  );

  return (
    <div className={`message-row ${isUser ? "user" : "assistant"}`}>
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
                      rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]}
                      components={markdownComponents}
                    >
                      {preprocessedMarkdown}
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

function areMessagePropsEqual(prevProps, nextProps) {
  if (prevProps.messageIndex !== nextProps.messageIndex) return false;
  if (prevProps.loading !== nextProps.loading) return false;
  if (prevProps.onOpenStudio !== nextProps.onOpenStudio) return false;
  const pm = prevProps.message;
  const nm = nextProps.message;
  if (pm === nm) return true;
  if (!pm || !nm) return false;
  return (
    pm.role === nm.role &&
    pm.content === nm.content &&
    pm.isStreaming === nm.isStreaming &&
    pm.isStopped === nm.isStopped &&
    pm.timestamp === nm.timestamp &&
    pm.image === nm.image &&
    (pm.sources?.length || 0) === (nm.sources?.length || 0)
  );
}

export default memo(MessageItem, areMessagePropsEqual);

