import React, { useState, useMemo, memo } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-css";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import { Copy, Check, Maximize2, Play, Layers } from "lucide-react";

const LANGUAGE_DISPLAY_NAMES = {
  py: "Python",
  python: "Python",
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  jsx: "React JSX",
  tsx: "React TSX",
  html: "HTML",
  htm: "HTML",
  css: "CSS",
  sh: "Bash",
  bash: "Bash",
  shell: "Bash",
  zsh: "Bash",
  json: "JSON",
  sql: "SQL",
  c: "C",
  cpp: "C++",
  "c++": "C++",
  java: "Java",
  rust: "Rust",
  rs: "Rust",
  go: "Go",
  golang: "Go",
  markdown: "Markdown",
  md: "Markdown",
  yaml: "YAML",
  yml: "YAML",
  xml: "XML",
  svg: "SVG",
};

const PRISM_LANGUAGE_MAP = {
  py: "python",
  python: "python",
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  jsx: "jsx",
  tsx: "tsx",
  html: "markup",
  htm: "markup",
  xml: "markup",
  svg: "markup",
  css: "css",
  sh: "bash",
  bash: "bash",
  shell: "bash",
  zsh: "bash",
  json: "json",
  sql: "sql",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  java: "java",
  rust: "rust",
  rs: "rust",
  go: "go",
  golang: "go",
};

const GrokCodeBlock = memo(function GrokCodeBlock({
  language = "",
  code = "",
  isInteractive = false,
  artifact = null,
  onOpenStudio = null,
}) {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || "").toLowerCase().trim();
  const displayName = LANGUAGE_DISPLAY_NAMES[cleanLang] || (cleanLang ? cleanLang.toUpperCase() : "Code");
  const prismLang = PRISM_LANGUAGE_MAP[cleanLang] || cleanLang;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExpand = (e) => {
    e.stopPropagation();
    if (onOpenStudio) {
      if (artifact) {
        onOpenStudio(artifact);
      } else {
        onOpenStudio({
          id: `code-${Date.now()}`,
          title: `${displayName} Code`,
          type: isInteractive ? "app" : "code",
          language: cleanLang || "text",
          code,
          createdAt: Date.now(),
        });
      }
    }
  };

  // Syntax highlighting via Prism memoized for performance
  const highlightedHtml = useMemo(() => {
    try {
      const grammar = Prism.languages[prismLang] || (cleanLang.includes("py") ? Prism.languages.python : null);
      if (grammar) {
        return Prism.highlight(code, grammar, prismLang);
      }
    } catch (err) {
      console.warn("Prism highlight error:", err);
    }
    return null;
  }, [code, prismLang, cleanLang]);

  return (
    <div className="grok-code-card">
      {/* Top Header Bar matching Grok */}
      <div className="grok-code-header">
        <div className="grok-code-header-left">
          <span className="grok-code-lang">{displayName}</span>
          {isInteractive && (
            <span className="grok-interactive-badge">
              <Layers size={11} /> Sandbox Ready
            </span>
          )}
        </div>

        <div className="grok-code-header-actions">
          {isInteractive ? (
            <button
              type="button"
              className="grok-header-btn btn-open-studio-pill"
              onClick={handleExpand}
              title="Open and run in Studio sandbox"
            >
              <Play size={12} fill="currentColor" />
              <span>Open in Studio</span>
            </button>
          ) : (
            onOpenStudio && (
              <button
                type="button"
                className="grok-header-btn"
                onClick={handleExpand}
                title="Open in full screen Studio code editor"
              >
                <Maximize2 size={13} />
              </button>
            )
          )}

          <button
            type="button"
            className={`grok-header-btn grok-copy-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
            title={copied ? "Copied to clipboard" : "Copy code"}
          >
            {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Code Body */}
      <pre className="grok-code-pre">
        {highlightedHtml ? (
          <code
            className={`grok-code-content language-${cleanLang}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <code className={`grok-code-content language-${cleanLang}`}>
            {code}
          </code>
        )}
      </pre>
    </div>
  );
});

export default GrokCodeBlock;

