import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Maximize2,
  RefreshCw,
  MessageSquare,
  Trash2,
  Wand2,
  Palette,
  Image as ImageIcon,
  Check,
  X,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { generateImage } from "../api";

const PROMPT_SUGGESTIONS = [
  "A majestic golden lion with a glowing crown resting in a cosmic sanctuary, nebulae background, cinematic 8k",
  "Futuristic cyberpunk hypercar racing on a neon-lit rain-slicked highway at midnight, reflections, octane render",
  "Cozy warm coffee shop on a rainy afternoon in Kyoto, lo-fi aesthetic, soft atmospheric lighting, anime style",
  "Ancient overgrown mystical stone temple hidden within a Bioluminescent jungle, volumetric sunbeams",
  "Minimalist geometric glass sculpture floating above a calm mirrored ocean at golden hour sunset, 3D render",
  "Detailed close-up portrait of an astronaut looking at an alien floral planet reflected in their gold visor visor",
  "Vintage 1980s retro anime city street with flying cars, pastel sunset sky, vaporwave aesthetic",
  "Epic fantasy castle perched on floating crystalline islands with waterfalls falling into open sky",
];

const STYLE_OPTIONS = [
  { id: "Photorealistic", label: "Photoreal", badge: "8K DSLR" },
  { id: "Cinematic", label: "Cinematic", badge: "Film Still" },
  { id: "Anime / Manga", label: "Anime", badge: "Vibrant" },
  { id: "3D Digital Art", label: "3D Art", badge: "Octane" },
  { id: "Cyberpunk", label: "Cyberpunk", badge: "Neon" },
  { id: "Fantasy Art", label: "Fantasy", badge: "Epic" },
  { id: "Watercolor", label: "Watercolor", badge: "Artistic" },
  { id: "Vintage Comic", label: "Retro Comic", badge: "1980s" },
  { id: "Minimalist Vector", label: "Vector", badge: "Clean" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1 Square", sub: "1024×1024", icon: "▢" },
  { id: "16:9", label: "16:9 Landscape", sub: "1280×720", icon: "▭" },
  { id: "9:16", label: "9:16 Portrait", sub: "720×1280", icon: "▯" },
  { id: "4:3", label: "4:3 Classic", sub: "1024×768", icon: "▱" },
  { id: "3:4", label: "3:4 Tall", sub: "768×1024", icon: "▰" },
];

const STORAGE_KEY_CREATIONS = "johngpt_created_images";

export default function ImageStudio({ onClose, onSendToChat, initialPrompt = "" }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedStyle, setSelectedStyle] = useState("Photorealistic");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [currentImage, setCurrentImage] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CREATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(history));
    } catch (e) {
      console.warn("Storage quota for images exceeded", e);
    }
  }, [history]);

  // Loading steps animation
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (overridePrompt) => {
    const textToUse = (overridePrompt || prompt).trim();
    if (!textToUse || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await generateImage({
        prompt: textToUse,
        aspect_ratio: selectedRatio,
        style: selectedStyle,
      });

      const newEntry = {
        id: Date.now().toString(),
        imageUrl: result.image_url,
        prompt: textToUse,
        style: selectedStyle,
        aspectRatio: selectedRatio,
        modelUsed: result.model_used,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setCurrentImage(newEntry);
      setHistory((prev) => [newEntry, ...prev.slice(0, 20)]);
    } catch (err) {
      console.error("Image generation error:", err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSurpriseMe = () => {
    const randomPrompt = PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)];
    setPrompt(randomPrompt);
  };

  const handleDownload = (imgUrl, promptText) => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    const cleanName = (promptText || "johngpt-creation")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);
    a.download = `johngpt-${cleanName}-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async () => {
    if (!currentImage?.imageUrl) return;
    try {
      if (currentImage.imageUrl.startsWith("data:")) {
        const response = await fetch(currentImage.imageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      } else {
        await navigator.clipboard.writeText(currentImage.imageUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy prompt text
      navigator.clipboard.writeText(currentImage.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear all generation history?")) {
      setHistory([]);
      try {
        localStorage.removeItem(STORAGE_KEY_CREATIONS);
      } catch {}
    }
  };

  const LOADING_STEPS = [
    "Analyzing prompt & visual keywords...",
    "Synthesizing high-resolution neural layers...",
    "Refining lighting, textures & aesthetic details...",
    "Finalizing image rendering...",
  ];

  return (
    <div className="image-studio-container fade-in">
      {/* Studio Top Header */}
      <div className="image-studio-header">
        <div className="image-studio-title-group">
          <div className="studio-brand-badge">
            <Palette size={18} className="text-accent" />
            <span className="studio-brand-title">Create Studio</span>
          </div>
          <span className="studio-model-indicator">
            <Sparkles size={13} className="text-accent" />
            Nano Banana Pro · High-Res AI
          </span>
        </div>

        <div className="image-studio-actions">
          {history.length > 0 && (
            <button
              type="button"
              className="btn-studio-header-action"
              onClick={handleClearHistory}
              title="Clear past generations"
            >
              <Trash2 size={15} />
              <span>Clear History</span>
            </button>
          )}

          <button
            type="button"
            className="btn-studio-close"
            onClick={onClose}
            title="Return to Chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Studio Body: Left Controls & Right Canvas */}
      <div className="image-studio-workspace">
        {/* Left Control Panel: Prompt, Styles, Ratios */}
        <div className="image-studio-sidebar">
          {/* Prompt Input Box */}
          <div className="studio-card-panel">
            <div className="studio-panel-label-row">
              <label className="studio-panel-label">Describe your image</label>
              <button
                type="button"
                className="btn-surprise-me"
                onClick={handleSurpriseMe}
                title="Get inspiration"
              >
                <Wand2 size={13} className="text-accent" />
                <span>Inspire me</span>
              </button>
            </div>

            <div className="studio-prompt-box">
              <textarea
                className="studio-prompt-textarea"
                rows={4}
                placeholder="Describe what you want to see in rich detail... e.g. A cybernetic lion in golden armor standing in Tokyo rain, neon reflection, 8k cinematic photography"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleGenerate();
                  }
                }}
              />
              <div className="studio-prompt-footer">
                <span className="studio-char-count">{prompt.length} / 2000</span>
                {prompt && (
                  <button
                    type="button"
                    className="btn-clear-prompt"
                    onClick={() => setPrompt("")}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Style Presets */}
          <div className="studio-card-panel">
            <label className="studio-panel-label">Artistic Style</label>
            <div className="studio-style-grid">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`studio-style-chip ${selectedStyle === style.id ? "active" : ""}`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <span className="style-chip-name">{style.label}</span>
                  <span className="style-chip-badge">{style.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="studio-card-panel">
            <label className="studio-panel-label">Aspect Ratio</label>
            <div className="studio-ratio-grid">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  className={`studio-ratio-card ${selectedRatio === ratio.id ? "active" : ""}`}
                  onClick={() => setSelectedRatio(ratio.id)}
                >
                  <span className="ratio-icon">{ratio.icon}</span>
                  <span className="ratio-label">{ratio.label}</span>
                  <span className="ratio-sub">{ratio.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="studio-generate-action-box">
            <button
              type="button"
              className="btn-studio-generate"
              disabled={loading || !prompt.trim()}
              onClick={() => handleGenerate()}
            >
              {loading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Synthesizing Image...</span>
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  <span>Generate Image</span>
                </>
              )}
            </button>
            <span className="studio-shortcut-hint">Press Ctrl + Enter to generate</span>
          </div>

          {error && (
            <div className="studio-error-banner">
              <Info size={15} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Stage: Image Viewer & Gallery */}
        <div className="image-studio-stage">
          {/* Active Canvas Display */}
          <div className="studio-canvas-card">
            {loading ? (
              <div className="studio-loading-view">
                <div className="studio-loading-orb">
                  <Sparkles size={36} className="text-accent animate-pulse" />
                </div>
                <div className="studio-loading-text-wrap">
                  <h4 className="studio-loading-title">Generating your vision</h4>
                  <p className="studio-loading-step">{LOADING_STEPS[loadingStep]}</p>
                </div>
                <div className="studio-loading-bar-wrap">
                  <div
                    className="studio-loading-bar-progress"
                    style={{ width: `${(loadingStep + 1) * 25}%` }}
                  />
                </div>
              </div>
            ) : currentImage ? (
              <div className="studio-result-wrap">
                <div className="studio-image-preview-box">
                  <img
                    src={currentImage.imageUrl}
                    alt={currentImage.prompt}
                    className="studio-rendered-image"
                    onClick={() => setLightboxOpen(true)}
                  />

                  {/* Quick Action Overlay */}
                  <div className="studio-image-overlay-actions">
                    <button
                      type="button"
                      className="studio-overlay-btn"
                      onClick={() => handleDownload(currentImage.imageUrl, currentImage.prompt)}
                      title="Download image"
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      className="studio-overlay-btn"
                      onClick={handleCopy}
                      title="Copy image or prompt"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      type="button"
                      className="studio-overlay-btn"
                      onClick={() => setLightboxOpen(true)}
                      title="View fullscreen"
                    >
                      <Maximize2 size={16} />
                    </button>

                    {onSendToChat && (
                      <button
                        type="button"
                        className="studio-overlay-btn highlight"
                        onClick={() => onSendToChat(currentImage.imageUrl, currentImage.prompt)}
                        title="Chat about this image with JohnGPT"
                      >
                        <MessageSquare size={16} />
                        <span>Discuss with JohnGPT</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Footer */}
                <div className="studio-image-meta-bar">
                  <div className="studio-image-prompt-details">
                    <span className="meta-prompt-text">{currentImage.prompt}</span>
                    <div className="meta-tags-row">
                      <span className="meta-tag">{currentImage.style}</span>
                      <span className="meta-tag">{currentImage.aspectRatio}</span>
                      <span className="meta-tag model-tag">{currentImage.modelUsed}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="studio-placeholder-view">
                <div className="studio-placeholder-icon-wrap">
                  <ImageIcon size={44} className="text-accent-subtle" />
                </div>
                <h3 className="studio-placeholder-title">Create Anything You Imagine</h3>
                <p className="studio-placeholder-desc">
                  Describe any scene, character, product, or artistic visual. JohnGPT's image studio synthesizes high-fidelity artwork ready for download.
                </p>
                <div className="studio-placeholder-prompts">
                  <span className="sample-pill-header">Try a sample prompt:</span>
                  <div className="sample-pills-row">
                    {PROMPT_SUGGESTIONS.slice(0, 3).map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        className="sample-prompt-pill"
                        onClick={() => {
                          setPrompt(sample);
                          handleGenerate(sample);
                        }}
                      >
                        <Sparkles size={12} className="text-accent" />
                        <span>{sample.slice(0, 48)}...</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History Gallery */}
          {history.length > 0 && (
            <div className="studio-history-section">
              <div className="studio-history-header">
                <h4 className="studio-history-title">Recent Creations ({history.length})</h4>
              </div>
              <div className="studio-history-grid">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`studio-history-card ${currentImage?.id === item.id ? "active" : ""}`}
                    onClick={() => setCurrentImage(item)}
                  >
                    <img src={item.imageUrl} alt={item.prompt} className="history-thumb" />
                    <div className="history-card-hover">
                      <p className="history-hover-prompt">{item.prompt}</p>
                      <div className="history-hover-actions">
                        <button
                          type="button"
                          className="btn-history-quick"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.imageUrl, item.prompt);
                          }}
                          title="Download"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-history-quick"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrompt(item.prompt);
                            setSelectedStyle(item.style);
                            setSelectedRatio(item.aspectRatio);
                          }}
                          title="Reuse Prompt"
                        >
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && currentImage && (
        <div className="studio-lightbox-backdrop fade-in" onClick={() => setLightboxOpen(false)}>
          <div className="studio-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-lightbox-close"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={20} />
            </button>
            <img
              src={currentImage.imageUrl}
              alt={currentImage.prompt}
              className="lightbox-img"
            />
            <div className="lightbox-footer">
              <p className="lightbox-prompt">{currentImage.prompt}</p>
              <div className="lightbox-actions">
                <button
                  type="button"
                  className="studio-overlay-btn"
                  onClick={() => handleDownload(currentImage.imageUrl, currentImage.prompt)}
                >
                  <Download size={15} />
                  <span>Download</span>
                </button>
                {onSendToChat && (
                  <button
                    type="button"
                    className="studio-overlay-btn highlight"
                    onClick={() => {
                      setLightboxOpen(false);
                      onSendToChat(currentImage.imageUrl, currentImage.prompt);
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>Discuss in Chat</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

