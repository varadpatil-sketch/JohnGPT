import React, { useRef, useEffect, useState } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  X,
  FileText,
  RotateCcw,
  Square,
  Sliders,
  Download,
  Copy,
  Check,
  Printer,
  ChevronDown,
  Mic,
  MicOff,
  Headphones,
  Plus,
  Code,
  Lightbulb,
  ArrowUp,
  Layers,
  HelpCircle,
  Coffee,
  Play,
  GraduationCap,
  ArrowDown,
  Presentation,
} from "lucide-react";
import MessageItem from "./MessageItem";
import ThinkingIndicator from "./ThinkingIndicator";
import { createSpeechRecognizer, isSpeechRecognitionSupported } from "../utils/voice";

class MessageItemErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("MessageItem crashed:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="message-row assistant fade-in" style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#fca5a5", fontSize: "0.85rem", margin: "8px 0" }}>
          <span>⚠️ Could not render this message component.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

// JohnGPT Brand Emblem / Logo Icon
function NeonBrandIcon({ size = 48 }) {
  return (
    <div
      className="johngpt-hero-icon johngpt-hero-icon-static"
      style={{
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "#121212",
        border: "2px solid rgba(234, 179, 8, 0.6)",
        boxShadow: "0 0 24px rgba(234, 179, 8, 0.4), 0 4px 16px rgba(0, 0, 0, 0.6)",
        padding: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        animation: "none",
        transform: "none",
        transition: "none",
      }}
    >
      <img
        src="/logo.png"
        alt="JohnGPT"
        className="johngpt-hero-logo johngpt-hero-logo-static"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          animation: "none",
          transform: "none",
          transition: "none",
        }}
      />
    </div>
  );
}

// Claude-style 5-bar audio waveform icon
function WaveformIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="waveform-icon">
      <rect x="2" y="9" width="2" height="6" rx="1" />
      <rect x="7" y="5" width="2" height="14" rx="1" />
      <rect x="12" y="2" width="2" height="20" rx="1" />
      <rect x="17" y="6" width="2" height="12" rx="1" />
      <rect x="22" y="10" width="2" height="4" rx="1" />
    </svg>
  );
}

// Quick inspiration action pills below chatbox
const QUICK_PILLS = [
  { label: "Ask", icon: HelpCircle, prompt: "Help me answer and think through: " },
  { label: "Learn", icon: GraduationCap, prompt: "Teach me about the core concepts, principles, and practical examples of " },
  { label: "Code", icon: Code, prompt: "Write clean, modular, and performant code for " },
  { label: "Life", icon: Coffee, prompt: "Give me helpful, thoughtful advice, ideas, or tips for " },
  { label: "JohnGPT's choice", icon: Lightbulb, prompt: "Surprise me with something creative, thought-provoking, or fascinating today." },
];

// Curated Top Free AI Models supported by JohnGPT
const AVAILABLE_MODELS = [
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", badge: "Google AI · Ultra Fast (Default)" },
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", badge: "Google AI · Lightweight" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", badge: "Google AI · Deep Reasoning & Coding" },
  { id: "qwen/qwen3.8-27b", name: "Qwen 3.8 (27B)", badge: "Code & Dev · Groq (Free)" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 (70B)", badge: "Meta AI · OpenRouter" },
];

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning! What's on your mind today?";
  if (hour >= 12 && hour < 17) return "Good afternoon! How can I help you today?";
  if (hour >= 17 && hour < 22) return "Good evening! What would you like to explore?";
  return "Burning the midnight oil? How can I assist you?";
};

const CREATIVE_GREETINGS = [
  "Ready to create?",
  "What shall we build?",
  "Spark your next idea",
  "Curiosity starts here",
  "Where should we begin?",
  "Dream it. Build it.",
  "Ask, explore, build",
  "Ready when you are",
  "Big ideas start here",
  "Ideas in motion",
  "Think bold, build fast",
  "Code, create, explore",
  "Let's build together",
  "What's on your mind?",
  "Let's make something",
  "Ready for big ideas?",
  "From thought to code",
  "Focus mode on",
  "Create without limits",
  "Turn curiosity to code",
  "Ready to build?",
];

const getTimeBasedCreativeGreetings = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return [
      "Good morning, creator",
      "Fresh morning ideas",
      "Ready to conquer today?",
      "Rise and build",
      "Morning focus on",
    ];
  }
  if (hour >= 12 && hour < 17) {
    return [
      "Good afternoon, creator",
      "Midday inspiration",
      "Keep the momentum",
      "Powering your day",
      "Afternoon focus mode",
    ];
  }
  if (hour >= 17 && hour < 22) {
    return [
      "Good evening, creator",
      "Evening inspiration",
      "Ready to create tonight?",
      "Evening focus mode",
      "Night ideas in motion",
    ];
  }
  return [
    "Midnight brilliance",
    "Burning the midnight oil",
    "Night owl mode on",
    "Quiet hours, big ideas",
    "Midnight coding session",
  ];
};

const getRandomCreativeHeading = (exclude = null) => {
  const timePool = getTimeBasedCreativeGreetings();
  const pool = [...timePool, ...CREATIVE_GREETINGS].filter((item) => item !== exclude);
  return pool[Math.floor(Math.random() * pool.length)] || "Ready to create?";
};

const DYNAMIC_GREETINGS = [
  getTimeGreeting,
  "What's on your mind today?",
  "How can I help you today?",
  "What shall we create together today?",
  "Ask a question, brainstorm an idea, or write code...",
  "What would you like to explore or learn today?",
  "Ready when you are — what are we building?",
  "Need help writing, debugging, or analyzing data?",
  "What challenge can we tackle together today?",
  "Have a complex problem? Let's break it down...",
  "Curious about something? Ask away...",
  "Start with an idea, draft, or question...",
  "What's your primary focus for today?",
  "Draft an essay, build an app, or solve a puzzle...",
  "How can I assist your workflow right now?",
  "Tell me what you're thinking about...",
  "Where would you like to begin today?",
  "Got an interesting project in mind?",
  "Ready to explore some new ideas?",
];

const getRandomGreeting = (exclude = null) => {
  const candidates = DYNAMIC_GREETINGS.map((item) => (typeof item === "function" ? item() : item)).filter(
    (g) => g !== exclude
  );
  return candidates[Math.floor(Math.random() * candidates.length)] || "How can I help you today?";
};

export default function ChatArea({
  messages,
  input,
  setInput,
  sessionSwitchCount = 0,
  onSend,
  onStopGenerating,
  onContinueGenerating,
  onRegenerate,
  onEditMessage,
  onViewCitation,
  loading,
  selectedDoc,
  onClearSelectedDoc,
  currentSessionId,
  onUploadDocument,
  onAttachClick,
  onClearMessages,
  attachedImage,
  setAttachedImage,
  onOpenCustomInstructions,
  hasCustomInstructions,
  onOpenVoiceMode,
  onOpenStudio,
  onOpenSlideDeck,
  onOpenArtifact,
  selectedModel: propSelectedModel,
  onSelectModel,
}) {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const exportMenuRef = useRef(null);
  const recognizerRef = useRef(null);
  const viewportRef = useRef(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocError, setUploadDocError] = useState(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showDepthMenu, setShowDepthMenu] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [activeMode, setActiveMode] = useState("chat");
  const [internalSelectedModel, setInternalSelectedModel] = useState("gemini-3.5-flash");
  const [reasoningDepth, setReasoningDepth] = useState("Medium");
  const [dynamicGreeting, setDynamicGreeting] = useState(() => getRandomGreeting());
  const [heroHeading, setHeroHeading] = useState(() => getRandomCreativeHeading());
  const prevSwitchCountRef = useRef(sessionSwitchCount);

  // Update creative greetings ONLY on user-initiated session switch or new chat (never on page refresh/mount)
  useEffect(() => {
    if (sessionSwitchCount > 0 && sessionSwitchCount !== prevSwitchCountRef.current) {
      prevSwitchCountRef.current = sessionSwitchCount;
      setHeroHeading(getRandomCreativeHeading());
      setDynamicGreeting((prev) => getRandomGreeting(prev));
    }
  }, [sessionSwitchCount]);

  const lastMessage = messages[messages.length - 1];
  const canContinue = Boolean(
    !loading &&
    lastMessage &&
    lastMessage.role === "assistant" &&
    lastMessage.isStopped
  );

  const currentModelId = propSelectedModel || internalSelectedModel;
  const handleSelectModel = (id) => {
    if (onSelectModel) {
      onSelectModel(id);
    }
    setInternalSelectedModel(id);
  };

  const attachMenuRef = useRef(null);
  const modelMenuRef = useRef(null);
  const depthMenuRef = useRef(null);

  const handleToggleDictation = () => {
    if (!isSpeechRecognitionSupported()) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {}
        recognizerRef.current = null;
      }
      setIsListening(false);
      return;
    }

    try {
      const recognizer = createSpeechRecognizer({
        onResult: (res) => {
          if (res.full) {
            setInput((prev) => {
              const base = prev.trim();
              return base ? `${base} ${res.full}` : res.full;
            });
          }
        },
        onError: (err) => {
          console.warn("Dictation error:", err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
        continuous: false,
      });

      recognizerRef.current = recognizer;
      recognizer.start();
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start dictation:", err);
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const isUserScrolledUpRef = useRef(false);
  const isStreaming = loading || Boolean(lastMessage?.isStreaming);

  const scrollToBottom = (behavior = "smooth") => {
    if (viewportRef.current) {
      if (behavior === "smooth") {
        viewportRef.current.scrollTo({
          top: viewportRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }
    } else {
      try {
        messagesEndRef.current?.scrollIntoView({ behavior });
      } catch {
        messagesEndRef.current?.scrollIntoView();
      }
    }
    setShowScrollBottom(false);
    isUserScrolledUpRef.current = false;
  };

  const handleScroll = () => {
    if (!viewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isScrolledUp = distanceFromBottom > 120;
    setShowScrollBottom(isScrolledUp);
    isUserScrolledUpRef.current = isScrolledUp;
  };

  useEffect(() => {
    if (messages.length === 0) return;
    if (isUserScrolledUpRef.current) return;

    if (isStreaming) {
      // During active token streaming, instant scroll avoids competing smooth-scroll animation jitter
      if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }
    } else {
      scrollToBottom("smooth");
    }
  }, [messages, loading, isStreaming]);

  useEffect(() => {
    if (!input && textareaRef.current) {
      textareaRef.current.style.height = "26px";
    }
  }, [input]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target)) {
        setShowModelMenu(false);
      }
      if (depthMenuRef.current && !depthMenuRef.current.contains(event.target)) {
        setShowDepthMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(",")[1];
      setAttachedImage({
        dataUrl,
        base64,
        mimeType: file.type,
        name: file.name || "image.png",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDocFile = async (file) => {
    if (!file) return;
    setIsUploadingDoc(true);
    setUploadDocError(null);
    try {
      if (onUploadDocument) {
        await onUploadDocument(file);
      } else if (onAttachClick) {
        onAttachClick();
      }
    } catch (err) {
      console.error("Document upload failed:", err);
      setUploadDocError(err.message || "Failed to upload document");
      setTimeout(() => setUploadDocError(null), 5000);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        handleImageFile(file);
        break;
      }
    }
  };

  const handlePillClick = (promptText) => {
    setInput(promptText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, 50);
  };

  // Export handlers
  const handleExportMarkdown = () => {
    if (messages.length === 0) return;
    setShowExportMenu(false);
    const lines = [
      `# JohnGPT Conversation - Session: ${currentSessionId}`,
      `*Exported on ${new Date().toLocaleString()}*`,
      `---`,
      "",
    ];
    messages.forEach((msg) => {
      const role = msg.role === "user" ? "User" : "JohnGPT";
      lines.push(`### ${role}`);
      if (msg.image) {
        lines.push(`*[Image Attached]*`);
      }
      lines.push("");
      lines.push(msg.content);
      if (msg.sources && msg.sources.length > 0) {
        lines.push("");
        lines.push(`**Cited Sources:**`);
        msg.sources.forEach((s) => {
          lines.push(`- ${s.filename || "Document"} (Page ${s.page})`);
        });
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `johngpt_chat_${currentSessionId}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (messages.length === 0) return;
    setShowExportMenu(false);
    const data = {
      session_id: currentSessionId,
      exported_at: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        tool_used: m.tool_used || null,
        sources: m.sources || [],
        timestamp: m.timestamp || null,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `johngpt_chat_${currentSessionId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyTranscript = async () => {
    if (messages.length === 0) return;
    const transcript = messages
      .map((m) => `${m.role === "user" ? "User" : "JohnGPT"}:\n${m.content}`)
      .join("\n\n");
    await navigator.clipboard.writeText(transcript);
    setCopiedTranscript(true);
    setTimeout(() => {
      setCopiedTranscript(false);
      setShowExportMenu(false);
    }, 1500);
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Reusable Claude-style composer card
  const renderComposerCard = () => (
    <div className="claude-composer-card">
      {attachedImage && (
        <div className="attached-image-preview fade-in">
          <img
            src={attachedImage.dataUrl}
            alt="Upload preview"
            className="preview-thumb"
          />
          <div className="preview-info">
            <span className="preview-name">{attachedImage.name}</span>
            <span className="preview-tag">Image Attached</span>
          </div>
          <button
            type="button"
            className="btn-remove-image"
            onClick={() => setAttachedImage(null)}
            title="Remove attached image"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {isUploadingDoc && (
        <div className="attached-doc-preview is-uploading fade-in">
          <div className="doc-preview-icon spinning">
            <FileText size={16} />
          </div>
          <div className="preview-info">
            <span className="preview-name">Uploading & indexing document...</span>
            <span className="preview-tag">Processing pages & vector chunks</span>
          </div>
        </div>
      )}

      {selectedDoc && !isUploadingDoc && (
        <div className="attached-doc-preview fade-in">
          <div className="doc-preview-icon">
            <FileText size={16} />
          </div>
          <div className="preview-info">
            <span className="preview-name">{selectedDoc.filename}</span>
            <span className="preview-tag">{selectedDoc.file_type?.toUpperCase() || "DOC"} Attached • Grounded Q&A</span>
          </div>
          <button
            type="button"
            className="btn-remove-doc"
            onClick={onClearSelectedDoc}
            title="Remove attached document"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {uploadDocError && (
        <div className="doc-upload-error-pill fade-in">
          <span>⚠️ {uploadDocError}</span>
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="claude-composer-textarea"
        rows={messages.length === 0 ? 2 : 1}
        placeholder={
          attachedImage
            ? "Ask about this image..."
            : selectedDoc
            ? `Ask about ${selectedDoc.filename}...`
            : dynamicGreeting
        }
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />

      <div className="claude-composer-controls">
        {/* Left Side: + Button and [Chat] [Cowork] Segmented Toggle */}
        <div className="controls-left">
          <div className="attach-menu-wrapper" ref={attachMenuRef}>
            <button
              type="button"
              className="btn-claude-attach"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              title="Attach image or document"
            >
              <Plus size={18} />
            </button>

            {showAttachMenu && (
              <div className="claude-dropdown-menu attach-dropdown fade-in">
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowAttachMenu(false);
                    imageInputRef.current?.click();
                  }}
                >
                  <ImageIcon size={15} />
                  <span>Attach Image</span>
                </button>
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowAttachMenu(false);
                    docInputRef.current?.click();
                  }}
                >
                  <FileText size={15} />
                  <span>Upload Document</span>
                </button>
              </div>
            )}
          </div>

          <div className="claude-mode-toggle">
            <button
              type="button"
              className={`mode-toggle-btn ${activeMode === "chat" ? "active" : ""}`}
              onClick={() => setActiveMode("chat")}
            >
              Chat
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${activeMode === "cowork" ? "active" : ""}`}
              onClick={() => setActiveMode("cowork")}
            >
              Cowork
            </button>
          </div>
        </div>

        {/* Right Side: Model & Depth, Mic, Voice Waveform, Send/Stop */}
        <div className="controls-right">
          {/* Model selector */}
          <div className="model-menu-wrapper" ref={modelMenuRef}>
            <button
              type="button"
              className="btn-claude-model"
              onClick={() => {
                setShowModelMenu(!showModelMenu);
                setShowDepthMenu(false);
              }}
              title="Select AI Model"
            >
              <span className="model-name">
                {AVAILABLE_MODELS.find((m) => m.id === currentModelId)?.name || "Gemini 3.5 Flash"}
              </span>
              <ChevronDown size={11} className="model-caret" />
            </button>

            {showModelMenu && (
              <>
                <div
                  className="mobile-dropdown-backdrop"
                  onClick={() => setShowModelMenu(false)}
                />
                <div className="claude-dropdown-menu model-dropdown fade-in">
                  <div className="mobile-sheet-handle" />
                  <div className="dropdown-section-title">Select AI Model</div>
                  {AVAILABLE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`dropdown-menu-item ${currentModelId === m.id ? "selected" : ""}`}
                      onClick={() => {
                        handleSelectModel(m.id);
                        setShowModelMenu(false);
                      }}
                    >
                      <div className="model-item-text">
                        <span className="model-item-name">{m.name}</span>
                        <span className="model-item-badge">{m.badge}</span>
                      </div>
                      {currentModelId === m.id && <Check size={15} className="text-accent model-check-icon" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Separate Reasoning Effort selector */}
          <div className="depth-menu-wrapper" ref={depthMenuRef}>
            <button
              type="button"
              className="btn-claude-depth"
              onClick={() => {
                setShowDepthMenu(!showDepthMenu);
                setShowModelMenu(false);
              }}
              title="Select Reasoning Effort"
            >
              <span className="model-depth-label">{reasoningDepth}</span>
              <ChevronDown size={11} className="model-caret" />
            </button>

            {showDepthMenu && (
              <div className="claude-dropdown-menu depth-dropdown fade-in">
                <div className="dropdown-section-title">Reasoning Effort</div>
                {["Fast", "Medium", "Extended"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`dropdown-menu-item ${reasoningDepth === d ? "selected" : ""}`}
                    onClick={() => {
                      setReasoningDepth(d);
                      setShowDepthMenu(false);
                    }}
                  >
                    <span>{d}</span>
                    {reasoningDepth === d && <Check size={14} className="text-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dictation Mic Button with Caret */}
          <button
            type="button"
            className={`btn-claude-mic ${isListening ? "listening pulse-recording" : ""}`}
            onClick={handleToggleDictation}
            title={isListening ? "Listening... Click to stop" : "Voice dictation (Speech to text)"}
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            <ChevronDown size={11} className="mic-caret" />
          </button>

          {/* Voice Mode (Interactive Fullscreen Waveform) */}
          <button
            type="button"
            className="btn-claude-voice"
            onClick={onOpenVoiceMode}
            title="Interactive Voice Mode (Live STT & Speech)"
          >
            <WaveformIcon size={16} />
          </button>

          {/* Send, Stop, or Continue Button */}
          {loading ? (
            <button
              type="button"
              className="btn-claude-stop"
              onClick={onStopGenerating}
              title="Pause / Stop generating"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : canContinue && !input.trim() && !attachedImage ? (
            <button
              type="button"
              className="btn-claude-continue"
              onClick={() => onContinueGenerating && onContinueGenerating()}
              title="Continue generating response (Unpause)"
            >
              <Play size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              className={`btn-claude-send ${(input.trim() || attachedImage) ? "active" : ""}`}
              disabled={(!input.trim() && !attachedImage) || loading}
              onClick={onSend}
              title="Send message (Enter)"
            >
              <ArrowUp size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Sleek single-line compact composer when conversation has started
  const renderCompactComposer = () => (
    <div className="claude-compact-composer">
      {/* Left: Plus attachment button */}
      <div className="attach-menu-wrapper" ref={attachMenuRef}>
        <button
          type="button"
          className="btn-claude-attach"
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          title="Attach image or document"
        >
          <Plus size={18} />
        </button>

        {showAttachMenu && (
          <div className="claude-dropdown-menu attach-dropdown fade-in">
            <button
              type="button"
              className="dropdown-menu-item"
              onClick={() => {
                setShowAttachMenu(false);
                imageInputRef.current?.click();
              }}
            >
              <ImageIcon size={15} />
              <span>Attach Image</span>
            </button>
            <button
              type="button"
              className="dropdown-menu-item"
              onClick={() => {
                setShowAttachMenu(false);
                docInputRef.current?.click();
              }}
            >
              <FileText size={15} />
              <span>Upload Document</span>
            </button>
          </div>
        )}
      </div>

      {/* Middle: Sleek single-line Textarea with auto-expansion */}
      <textarea
        ref={textareaRef}
        className="claude-compact-textarea"
        rows={1}
        placeholder={
          attachedImage
            ? "Ask about this image..."
            : selectedDoc
            ? `Ask about ${selectedDoc.filename}...`
            : "Write a message..."
        }
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />

      {/* Right Controls */}
      <div className="compact-controls-right">
        {/* Compact Model Selector */}
        <div className="model-menu-wrapper" ref={modelMenuRef}>
          <button
            type="button"
            className="btn-compact-model"
            onClick={() => {
              setShowModelMenu(!showModelMenu);
              setShowDepthMenu(false);
            }}
            title="Select AI Model"
          >
            <span className="compact-model-name">
              {AVAILABLE_MODELS.find((m) => m.id === currentModelId)?.name || "Gemini 3.5 Flash"}
            </span>
            <ChevronDown size={11} className="model-caret" />
          </button>

          {showModelMenu && (
            <>
              <div
                className="mobile-dropdown-backdrop"
                onClick={() => setShowModelMenu(false)}
              />
              <div className="claude-dropdown-menu model-dropdown fade-in">
                <div className="mobile-sheet-handle" />
                <div className="dropdown-section-title">Select AI Model</div>
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`dropdown-menu-item ${currentModelId === m.id ? "selected" : ""}`}
                    onClick={() => {
                      handleSelectModel(m.id);
                      setShowModelMenu(false);
                    }}
                  >
                    <div className="model-item-text">
                      <span className="model-item-name">{m.name}</span>
                      <span className="model-item-badge">{m.badge}</span>
                    </div>
                    {currentModelId === m.id && <Check size={15} className="text-accent model-check-icon" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Compact Reasoning Depth Selector */}
        <div className="depth-menu-wrapper" ref={depthMenuRef}>
          <button
            type="button"
            className="btn-compact-depth"
            onClick={() => {
              setShowDepthMenu(!showDepthMenu);
              setShowModelMenu(false);
            }}
            title="Select Reasoning Effort"
          >
            <span className="compact-depth-name">{reasoningDepth}</span>
            <ChevronDown size={11} className="model-caret" />
          </button>

          {showDepthMenu && (
            <div className="claude-dropdown-menu depth-dropdown fade-in">
              <div className="dropdown-section-title">Reasoning Effort</div>
              {["Fast", "Medium", "Extended"].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`dropdown-menu-item ${reasoningDepth === d ? "selected" : ""}`}
                  onClick={() => {
                    setReasoningDepth(d);
                    setShowDepthMenu(false);
                  }}
                >
                  <span>{d}</span>
                  {reasoningDepth === d && <Check size={14} className="text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dictation Mic */}
        <button
          type="button"
          className={`btn-claude-mic ${isListening ? "listening pulse-recording" : ""}`}
          onClick={handleToggleDictation}
          title={isListening ? "Listening... Click to stop" : "Voice dictation (Speech to text)"}
        >
          {isListening ? <MicOff size={15} /> : <Mic size={15} />}
        </button>

        {/* Voice Mode */}
        <button
          type="button"
          className="btn-claude-voice"
          onClick={onOpenVoiceMode}
          title="Interactive Voice Mode (Live STT & Speech)"
        >
          <WaveformIcon size={16} />
        </button>

        {/* Send / Stop / Continue Action */}
        {loading ? (
          <button
            type="button"
            className="btn-claude-stop"
            onClick={onStopGenerating}
            title="Pause / Stop generating"
          >
            <Square size={12} fill="currentColor" />
          </button>
        ) : canContinue && !input.trim() && !attachedImage ? (
          <button
            type="button"
            className="btn-claude-continue"
            onClick={() => onContinueGenerating && onContinueGenerating()}
            title="Continue generating response (Unpause)"
          >
            <Play size={13} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            className={`btn-claude-send ${(input.trim() || attachedImage) ? "active" : ""}`}
            disabled={(!input.trim() && !attachedImage) || loading}
            onClick={onSend}
            title="Send message (Enter)"
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <main className={`chat-main ${messages.length === 0 ? "is-empty-layout" : ""}`}>
      {/* Hidden File Inputs for Image & Document Attachments */}
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleImageFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />
      <input
        type="file"
        ref={docInputRef}
        style={{ display: "none" }}
        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.tsv,.txt,.md,.markdown,.json,.yaml,.yml,.xml,.py,.js,.jsx,.ts,.tsx,.html,.css,.sql"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleDocFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {/* Top Bar */}
      <header className="chat-header">
        <div className="header-left">
          {selectedDoc && (
            <div className="doc-scoped-badge fade-in">
              <FileText size={13} className="text-accent" />
              <span>
                Scoped to: <strong>{selectedDoc.filename}</strong>
              </span>
              <button
                className="btn-clear-doc"
                onClick={onClearSelectedDoc}
                title="Remove document scope"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="header-right">
          {/* Voice Mode (Interactive Fullscreen Overlay) */}
          <button
            className="btn-header-tool btn-voice-mode"
            onClick={onOpenVoiceMode}
            title="Interactive Voice Mode (Live STT & Speech)"
          >
            <Headphones size={14} />
            <span className="hide-on-mobile">Voice Mode</span>
          </button>

          {/* Studio Workspace Launcher (Artifacts & Sandbox Apps) */}
          <button
            className="btn-header-tool btn-studio-launcher"
            onClick={() => onOpenStudio && onOpenStudio()}
            title="Open Studio Workspace (Interactive Web Apps, Code & Sandbox)"
          >
            <Layers size={14} className="text-accent" />
            <span className="hide-on-mobile">Studio</span>
          </button>

          {/* Interactive Slides & Presentations Launcher */}
          <button
            className="btn-header-tool btn-slides-launcher"
            onClick={() => onOpenSlideDeck && onOpenSlideDeck()}
            title="Interactive Slides & PowerPoint Presentation Builder"
          >
            <Presentation size={14} className="text-orange" />
            <span className="hide-on-mobile">Slides</span>
          </button>

          {/* Custom Instructions */}
          <button
            className={`btn-header-tool ${hasCustomInstructions ? "active-instructions" : ""}`}
            onClick={onOpenCustomInstructions}
            title="Custom Instructions (Persona & Response Style)"
          >
            <Sliders size={14} />
            <span className="hide-on-mobile">Custom Instructions</span>
            {hasCustomInstructions && <span className="active-dot" title="Custom Instructions Active" />}
          </button>

          {/* Export & Share Dropdown */}
          {messages.length > 0 && (
            <div className="export-dropdown-wrapper" ref={exportMenuRef}>
              <button
                className="btn-header-tool"
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Export or Share conversation"
              >
                <Download size={14} />
                <span className="hide-on-mobile">Export</span>
                <ChevronDown size={12} />
              </button>

              {showExportMenu && (
                <div className="export-menu-dropdown fade-in scale-in">
                  <button className="export-menu-item" onClick={handleExportMarkdown}>
                    <FileText size={14} />
                    <span>Export Markdown (.md)</span>
                  </button>
                  <button className="export-menu-item" onClick={handleExportJson}>
                    <Code size={14} />
                    <span>Export JSON (.json)</span>
                  </button>
                  <button className="export-menu-item" onClick={handleCopyTranscript}>
                    {copiedTranscript ? (
                      <Check size={14} className="text-success" />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>{copiedTranscript ? "Copied to Clipboard!" : "Copy Full Transcript"}</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button className="export-menu-item" onClick={handlePrint}>
                    <Printer size={14} />
                    <span>Print / Save as PDF</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reset Chat */}
          {messages.length > 0 && (
            <button
              className="btn-header-tool btn-danger-subtle"
              onClick={onClearMessages}
              title="Clear current view"
            >
              <RotateCcw size={14} />
              <span className="hide-on-mobile">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Viewport / Centered Empty State */}
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className={`messages-viewport ${messages.length === 0 ? "is-empty" : ""}`}
      >
        {messages.length === 0 ? (
          <div className="claude-empty-container fade-in">
            {/* Claude-style Hero Header with Creative Greeting */}
            <div className="claude-hero-header">
              <NeonBrandIcon size={26} />
              <h1 className="claude-serif-title">{heroHeading}</h1>
            </div>

            {/* Centered Composer Card */}
            <div className="claude-composer-wrapper">
              {renderComposerCard()}
            </div>

            {/* Quick Inspiration Action Pills below Composer */}
            <div className="claude-pills-row">
              {QUICK_PILLS.map((pill) => {
                const Icon = pill.icon;
                return (
                  <button
                    key={pill.label}
                    type="button"
                    className="claude-action-pill"
                    onClick={() => handlePillClick(pill.prompt)}
                  >
                    <Icon size={14} className="pill-icon" />
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg, index) => (
              <MessageItemErrorBoundary key={index}>
                <MessageItem
                  messageIndex={index}
                  message={msg}
                  onRegenerate={onRegenerate}
                  onEditMessage={onEditMessage}
                  onViewCitation={onViewCitation}
                  onContinueGenerating={onContinueGenerating}
                  loading={loading}
                  onOpenStudio={onOpenStudio}
                  onOpenSlideDeck={onOpenSlideDeck}
                  onOpenArtifact={onOpenArtifact}
                />
              </MessageItemErrorBoundary>
            ))}

            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="message-row assistant">
                <div className="message-avatar thinking-avatar">
                  <img src="/logo.png" alt="JohnGPT" className="message-bot-logo" />
                </div>
                <div className="message-content-wrapper">
                  <div className="message-bubble" style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0 }}>
                    <ThinkingIndicator />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Docked Input Composer (Only shown when there are messages in the conversation) */}
      {messages.length > 0 && (
        <div className="chat-input-container is-compact-dock">
          <div className="input-box-wrapper compact-wrapper">
            {showScrollBottom && (
              <div className="scroll-bottom-container fade-in">
                <button
                  type="button"
                  className="btn-scroll-to-bottom"
                  onClick={scrollToBottom}
                  title="Scroll to latest message"
                >
                  <ArrowDown size={15} />
                </button>
              </div>
            )}
            {canContinue && (
              <div className="continue-generating-bar fade-in">
                <button
                  type="button"
                  className="btn-continue-generating"
                  onClick={() => onContinueGenerating && onContinueGenerating()}
                  title="Unpause & continue response"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Continue generating</span>
                </button>
              </div>
            )}
            {isUploadingDoc && (
              <div className="attached-doc-compact-chip is-uploading fade-in">
                <FileText size={13} className="spinning" />
                <span>Uploading document...</span>
              </div>
            )}
            {selectedDoc && !isUploadingDoc && (
              <div className="attached-doc-compact-chip fade-in">
                <FileText size={13} />
                <span className="compact-chip-name" title={selectedDoc.filename}>{selectedDoc.filename}</span>
                <button
                  type="button"
                  className="btn-remove-chip"
                  onClick={onClearSelectedDoc}
                  title="Remove attached document"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {uploadDocError && (
              <div className="doc-upload-error-pill fade-in">
                <span>⚠️ {uploadDocError}</span>
              </div>
            )}
            {attachedImage && (
              <div className="attached-image-compact-chip fade-in">
                <img
                  src={attachedImage.dataUrl}
                  alt="Upload preview"
                  className="compact-chip-thumb"
                />
                <span className="compact-chip-name">{attachedImage.name}</span>
                <button
                  type="button"
                  className="btn-remove-chip"
                  onClick={() => setAttachedImage(null)}
                  title="Remove attached image"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {renderCompactComposer()}
          </div>
        </div>
      )}
    </main>
  );
}
