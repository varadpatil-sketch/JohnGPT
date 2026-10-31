import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  BookOpen,
  Layers,
} from "lucide-react";
import { fetchDocumentPage, getDocumentFileUrl } from "../api";

export default function DocumentViewer({ citation, onClose }) {
  if (!citation) return null;

  const { document_id, filename, text: citedText, score, search_type } = citation;
  const initialPage = citation.page || 1;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageData, setPageData] = useState({ content: "", chunks_count: 0 });
  const [loadingPage, setLoadingPage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    const isPdf = (filename || "").toLowerCase().endsWith(".pdf");
    return isPdf ? "document" : "text";
  });

  const isPdf = (filename || "").toLowerCase().endsWith(".pdf");
  const fileUrl = getDocumentFileUrl(document_id);

  // Sync state when a new citation is opened
  useEffect(() => {
    setCurrentPage(citation.page || 1);
  }, [citation]);

  // Fetch page text when page changes
  useEffect(() => {
    let isCurrent = true;
    async function loadPage() {
      setLoadingPage(true);
      try {
        const data = await fetchDocumentPage(document_id, currentPage);
        if (isCurrent) {
          setPageData(data);
        }
      } catch (e) {
        console.error("Failed to load page text:", e);
      } finally {
        if (isCurrent) setLoadingPage(false);
      }
    }
    loadPage();
    return () => {
      isCurrent = false;
    };
  }, [document_id, currentPage]);

  const handleCopyExcerpt = () => {
    navigator.clipboard.writeText(citedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="doc-viewer-panel fade-in">
      {/* Panel Header */}
      <div className="doc-viewer-header">
        <div className="doc-viewer-title-row">
          <div className="doc-icon-badge">
            <FileText size={16} />
          </div>
          <div className="doc-title-info">
            <h3 className="doc-viewer-filename" title={filename || document_id}>
              {filename || document_id}
            </h3>
            <div className="doc-viewer-badges">
              <span className="badge-page">Page / Section {currentPage}</span>
              {score && (
                <span className="badge-score" title="Reciprocal Rank Fusion Relevance Score">
                  <Sparkles size={11} />
                  Match: {(score * 100).toFixed(1)}%
                </span>
              )}
              <span className="badge-hybrid">
                {search_type || "Hybrid (Dense + BM25)"}
              </span>
            </div>
          </div>
        </div>

        <div className="doc-viewer-actions">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-doc-action"
            title="Open raw document in new tab"
          >
            <ExternalLink size={14} />
            <span>Open Original</span>
          </a>
          <button className="btn-close-viewer" onClick={onClose} title="Close Document Viewer">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Cited Excerpt Highlight Card */}
      <div className="cited-excerpt-card">
        <div className="excerpt-header">
          <div className="excerpt-tag">
            <BookOpen size={12} />
            <span>Cited Evidence in Response</span>
          </div>
          <button className="btn-copy-excerpt" onClick={handleCopyExcerpt}>
            {copied ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy Excerpt"}</span>
          </button>
        </div>
        <p className="excerpt-body">"{citedText}"</p>
      </div>

      {/* View Mode Switcher */}
      <div className="viewer-tabs">
        {isPdf && (
          <button
            className={`viewer-tab ${viewMode === "document" ? "active" : ""}`}
            onClick={() => setViewMode("document")}
          >
            <FileText size={13} />
            <span>Document Preview (PDF)</span>
          </button>
        )}
        <button
          className={`viewer-tab ${viewMode === "text" ? "active" : ""}`}
          onClick={() => setViewMode("text")}
        >
          <Layers size={13} />
          <span>Extracted Page Text</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="doc-viewer-content">
        {viewMode === "document" && isPdf ? (
          <div className="pdf-frame-wrapper">
            <iframe
              src={`${fileUrl}#page=${currentPage}&zoom=page-width`}
              className="pdf-preview-frame"
              title="PDF Document Preview"
            />
          </div>
        ) : (
          <div className="page-text-container">
            {loadingPage ? (
              <div className="page-loading">
                <span className="spinner" />
                <span>Loading page {currentPage} text...</span>
              </div>
            ) : pageData.content ? (
              <div className="page-content-box">
                <pre className="page-raw-text">{pageData.content}</pre>
              </div>
            ) : (
              <div className="page-empty-hint">
                <p>No additional extracted text available for page {currentPage}.</p>
                <p className="sub-hint">The cited snippet above represents the indexed passage.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Page Navigation */}
      <div className="doc-viewer-footer">
        <button
          className="btn-page-nav"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={14} />
          <span>Previous Page</span>
        </button>

        <span className="page-indicator">Page {currentPage}</span>

        <button
          className="btn-page-nav"
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          <span>Next Page</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </aside>
  );
}
