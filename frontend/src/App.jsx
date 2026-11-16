import React, { useState, useEffect, useRef } from "react";
import { Menu, SquarePen } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import DocumentViewer from "./components/DocumentViewer";
import CustomInstructionsModal from "./components/CustomInstructionsModal";
import VoiceModeModal from "./components/VoiceModeModal";
import Artifacts from "./components/Artifacts";
import CodeStudio from "./components/CodeStudio";
import ImageStudio from "./components/ImageStudio";
import SlideStudio, { DEFAULT_FOOTBALL_DECK } from "./components/SlideStudio";
import DocStudio, { DEFAULT_AI_DOC } from "./components/DocStudio";
import AppStudio, { DEFAULT_DASHBOARD_APP } from "./components/AppStudio";
import {
  checkHealth,
  fetchTools,
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  streamChatMessage,
  fetchSessions,
  createSession,
  fetchSessionMessages,
  updateSession,
  deleteSession,
} from "./api";
import "./App.css";

const STORAGE_KEY_CUSTOM_INSTRUCTIONS = "mollie_custom_instructions";
const STORAGE_KEY_SELECTED_MODEL = "mollie_selected_model";
const STORAGE_KEY_ACTIVE_SESSION = "mollie_active_session_id";

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [sessionSwitchCount, setSessionSwitchCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION) || "";
  });
  const [messagesBySession, setMessagesBySession] = useState({});

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, currentSessionId);
    }
  }, [currentSessionId]);

  const [customInstructions, setCustomInstructions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_INSTRUCTIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      aboutUser: "",
      responseStyle: "",
    };
  });
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showVoiceModeModal, setShowVoiceModeModal] = useState(false);
  const [activeMainView, setActiveMainView] = useState("chat"); // 'chat' | 'studio'
  const [activeStudioArtifact, setActiveStudioArtifact] = useState(null);
  const [activeArtifact, setActiveArtifact] = useState(null); // { id, title, type: 'slides' | 'doc' | 'app', data }
  const [isArtifactSplitView, setIsArtifactSplitView] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleOpenArtifact = (art) => {
    if (!art) return;
    let normalized = art;
    if (art.slides || art.theme) {
      normalized = {
        id: art.id || `art-${Date.now()}`,
        title: art.title || "Slides",
        type: "slides",
        data: art,
      };
    } else if (art.content && !art.html && !art.code) {
      normalized = {
        id: art.id || `art-${Date.now()}`,
        title: art.title || "Document",
        type: "doc",
        data: art,
      };
    } else if (!art.type && (art.html || art.code)) {
      normalized = {
        id: art.id || `art-${Date.now()}`,
        title: art.title || "Web App",
        type: "app",
        data: art,
      };
    }
    setActiveArtifact(normalized);
    setIsArtifactSplitView(true);
    setActiveMainView("chat");
  };

  const handleOpenStudio = (artifact = null) => {
    if (artifact) {
      setActiveStudioArtifact(artifact);
    }
    setActiveMainView("studio");
  };

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [tools, setTools] = useState([]);
  const [backendStatus, setBackendStatus] = useState({ online: false });
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);

  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_SELECTED_MODEL) || "gemini-3.5-flash-lite";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SELECTED_MODEL, selectedModel);
  }, [selectedModel]);

  // Sync custom instructions to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CUSTOM_INSTRUCTIONS, JSON.stringify(customInstructions));
  }, [customInstructions]);

  // Initial load: Backend health, tools, documents, and persistent SQLite sessions
  useEffect(() => {
    async function loadInitialData() {
      const status = await checkHealth();
      setBackendStatus(status);

      if (status.online) {
        const [toolsData, docsData, backendSessions] = await Promise.all([
          fetchTools(),
          fetchDocuments(),
          fetchSessions(),
        ]);
        setTools(toolsData);
        setDocuments(docsData);

        if (backendSessions && backendSessions.length > 0) {
          setSessions(backendSessions);
          const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
          const found = backendSessions.find((s) => s.id === savedActiveId);
          const activeId = found ? found.id : backendSessions[0].id;
          setCurrentSessionId(activeId);
          const initialMsgs = await fetchSessionMessages(activeId);
          setMessagesBySession({ [activeId]: initialMsgs });
        } else {
          // If no conversations exist, create the first one
          try {
            const firstSess = await createSession();
            setSessions([firstSess]);
            setCurrentSessionId(firstSess.id);
            setMessagesBySession({ [firstSess.id]: [] });
          } catch (err) {
            console.error("Initial session creation failed:", err);
          }
        }
      }
    }

    loadInitialData();
    const interval = setInterval(async () => {
      const status = await checkHealth();
      setBackendStatus(status);
    }, 15000);

    return () => clearInterval(interval);
  }, []);


  const currentMessages = messagesBySession[currentSessionId] || [];
  const selectedDoc = documents.find((d) => d.document_id === selectedDocId) || null;

  const abortControllerRef = useRef(null);

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setMessagesBySession((prev) => {
      const list = prev[currentSessionId] || [];
      if (list.length === 0) return prev;
      const updated = [...list];
      const last = updated[updated.length - 1];
      if (last && last.role === "assistant") {
        updated[updated.length - 1] = {
          ...last,
          isStreaming: false,
          isStopped: true,
        };
      }
      return { ...prev, [currentSessionId]: updated };
    });
  };

  const combineText = (prefix, addition) => {
    if (!prefix) return addition;
    if (!addition) return prefix;
    if (/\s$/.test(prefix) || /^\s/.test(addition)) {
      return prefix + addition;
    }
    return prefix + " " + addition;
  };

  const executeGeneration = async ({
    messageText,
    imageBase64,
    imageMimeType,
    targetAssistantIndex,
    modelOverride = null,
    initialTextToAppend = "",
    sessionIdOverride = null,
  }) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    let streamedText = "";
    let lastTool = null;
    let streamRafId = null;

    const flushStreamUpdate = () => {
      setMessagesBySession((prev) => {
        const list = prev[targetSessionId] || [];
        const idx = targetAssistantIndex !== undefined ? targetAssistantIndex : list.length - 1;
        if (!list[idx]) return prev;
        const updated = [...list];
        updated[idx] = {
          ...updated[idx],
          content: combineText(initialTextToAppend, streamedText),
          tool_used: lastTool,
          isStreaming: true,
          isStopped: false,
        };
        return { ...prev, [targetSessionId]: updated };
      });
    };

    const targetSessionId =
      sessionIdOverride ||
      currentSessionId ||
      `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const formattedInstructions =
      customInstructions?.enabled &&
      (customInstructions.aboutUser?.trim() || customInstructions.responseStyle?.trim())
        ? [
            customInstructions.aboutUser?.trim()
              ? `About User:\n${customInstructions.aboutUser.trim()}`
              : "",
            customInstructions.responseStyle?.trim()
              ? `Response Style & Persona:\n${customInstructions.responseStyle.trim()}`
              : "",
          ]
            .filter(Boolean)
            .join("\n\n")
        : null;

    try {
      await streamChatMessage({
        message: messageText,
        session_id: targetSessionId,
        document_id: selectedDocId,
        image_base64: imageBase64 || null,
        image_mime_type: imageMimeType || null,
        custom_instructions: formattedInstructions,
        model: modelOverride || selectedModel,
        signal: controller.signal,
        onToken: (token) => {
          streamedText += token;
          if (!streamRafId) {
            streamRafId = requestAnimationFrame(() => {
              streamRafId = null;
              flushStreamUpdate();
            });
          }
        },
        onTool: (event) => {
          lastTool = event.tool;
          setMessagesBySession((prev) => {
            const list = prev[targetSessionId] || [];
            const idx = targetAssistantIndex !== undefined ? targetAssistantIndex : list.length - 1;
            if (!list[idx]) return prev;
            const updated = [...list];
            updated[idx] = {
              ...updated[idx],
              tool_used: event.tool,
            };
            return { ...prev, [targetSessionId]: updated };
          });
        },
        onDone: (event) => {
          if (streamRafId) {
            cancelAnimationFrame(streamRafId);
            streamRafId = null;
          }
          if (event.new_title) {
            setSessions((prev) =>
              prev.map((s) => (s.id === targetSessionId ? { ...s, title: event.new_title } : s))
            );
          }
          setSessions((prev) => {
            const now = Date.now() / 1000;
            const updated = prev.map((s) =>
              s.id === targetSessionId ? { ...s, updated_at: now } : s
            );
            return updated.sort((a, b) => {
              if (b.is_pinned !== a.is_pinned) return (b.is_pinned || 0) - (a.is_pinned || 0);
              return (b.updated_at || 0) - (a.updated_at || 0);
            });
          });

          const finalPiece = event.answer || streamedText;
          const fullFinalContent = combineText(initialTextToAppend, finalPiece);

          // Auto-detect interactive slide deck generated by assistant
          if (
            fullFinalContent.includes("```slides") ||
            (fullFinalContent.includes("```json") &&
              fullFinalContent.includes('"slides"') &&
              (fullFinalContent.includes('"layout"') || fullFinalContent.includes('"kicker"')))
          ) {
            try {
              const match = /```(?:slides|json)\s*([\s\S]*?)```/.exec(fullFinalContent);
              if (match && match[1]) {
                const parsed = JSON.parse(match[1]);
                if (parsed && Array.isArray(parsed.slides)) {
                  handleOpenArtifact({
                    id: `deck-${Date.now()}`,
                    title: parsed.title || "Interactive Presentation",
                    type: "slides",
                    data: parsed,
                  });
                }
              }
            } catch (e) {
              // ignore partial parse error
            }
          }

          setMessagesBySession((prev) => {
            const list = prev[targetSessionId] || [];
            const idx = targetAssistantIndex !== undefined ? targetAssistantIndex : list.length - 1;
            if (!list[idx]) return prev;
            const updated = [...list];
            updated[idx] = {
              ...updated[idx],
              content: fullFinalContent,
              tool_used: event.tool_used || lastTool,
              sources: event.sources || [],
              isStreaming: false,
              isStopped: false,
            };
            return { ...prev, [targetSessionId]: updated };
          });
        },
        onError: (err) => {
          throw err;
        },
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        let displayError = "The AI service encountered a temporary error. Please tap 'Regenerate' or try again in a moment.";
        if (typeof err === "string") {
          const trimmed = err.trim();
          if (trimmed && trimmed !== "[object Object]" && trimmed !== "{}") {
            displayError = trimmed;
          }
        } else if (typeof err?.message === "string" && err.message.trim() && err.message.trim() !== "[object Object]" && err.message.trim() !== "{}") {
          displayError = err.message.trim();
        } else if (err?.detail) {
          if (typeof err.detail === "string") displayError = err.detail;
          else if (typeof err.detail === "object") {
            try { displayError = err.detail.message || JSON.stringify(err.detail); } catch (_) {}
          }
        } else if (err?.error) {
          if (typeof err.error === "string") displayError = err.error;
          else if (typeof err.error === "object") {
            try { displayError = err.error.message || JSON.stringify(err.error); } catch (_) {}
          }
        } else {
          try {
            const s = JSON.stringify(err);
            if (s && s !== "{}" && s !== "null" && s !== "[object Object]") {
              displayError = s;
            }
          } catch (_) {}
        }

        if (displayError === "[object Object]" || displayError === "{}") {
          displayError = "The AI service encountered a temporary error. Please tap 'Regenerate' or try again in a moment.";
        }

        // Cleanly format validation error arrays (e.g. from FastAPI/Pydantic)
        if (typeof displayError === "string" && displayError.trim().startsWith("[") && displayError.trim().endsWith("]")) {
          try {
            const arr = JSON.parse(displayError.trim());
            if (Array.isArray(arr) && arr.length > 0 && arr[0]?.msg) {
              const field = Array.isArray(arr[0].loc) ? arr[0].loc.filter((x) => x !== "body").join(".") : "";
              displayError = `Invalid request${field ? ` (${field})` : ""}: ${arr[0].msg}. Please tap 'Regenerate'.`;
            }
          } catch (_) {}
        }

        const low = displayError.toLowerCase();
        if (
          low.includes("429") ||
          low.includes("resource_exhausted") ||
          low.includes("quota exceeded") ||
          low.includes("rate limit")
        ) {
          displayError = "AI model rate limit reached. Please tap 'Regenerate' in a moment or select Gemini 3.5 Flash Lite.";
        } else if (low.includes("504") || low.includes("timeout")) {
          displayError = "Request timed out while generating this complex response. Please tap 'Regenerate' to try again.";
        } else if (low.includes("failed to fetch") || low.includes("networkerror") || low.includes("connection")) {
          displayError = "Connection to AI service was interrupted. Please check your network and tap 'Regenerate'.";
        }

        setMessagesBySession((prev) => {
          const list = prev[targetSessionId] || [];
          const idx = targetAssistantIndex !== undefined ? targetAssistantIndex : list.length - 1;
          if (!list[idx]) return prev;
          const updated = [...list];
          updated[idx] = {
            ...updated[idx],
            content:
              (streamedText ? streamedText + "\n\n" : "") +
              `⚠️ **Error:** ${displayError}`,
            isStreaming: false,
          };
          return { ...prev, [targetSessionId]: updated };
        });
      }
    } finally {
      if (streamRafId) {
        cancelAnimationFrame(streamRafId);
        streamRafId = null;
      }
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const handleSend = async (overrideText = null) => {
    const text = (typeof overrideText === "string" ? overrideText : input).trim();
    if ((!text && !attachedImage) || loading) return;

    const messageText = text || (attachedImage ? "Please analyze this image." : "");
    const currentImage = attachedImage;

    // Ensure we always have a valid, active session ID
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      setCurrentSessionId(activeSessionId);
      setSessions((prev) => [
        {
          id: activeSessionId,
          title: messageText.length > 28 ? messageText.substring(0, 28) + "..." : messageText,
          created_at: Date.now() / 1000,
          updated_at: Date.now() / 1000,
        },
        ...prev,
      ]);
    }

    const userMessage = {
      role: "user",
      content: messageText,
      image: currentImage?.dataUrl || null,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantPlaceholder = {
      role: "assistant",
      content: "",
      tool_used: null,
      sources: [],
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Update current session's title if it's the first message
    const existingMsgs = messagesBySession[activeSessionId] || [];
    if (existingMsgs.length === 0) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, title: messageText.length > 28 ? messageText.substring(0, 28) + "..." : messageText }
            : s
        )
      );
    }

    setMessagesBySession((prev) => ({
      ...prev,
      [activeSessionId]: [
        ...(prev[activeSessionId] || []),
        userMessage,
        assistantPlaceholder,
      ],
    }));

    setInput("");
    setAttachedImage(null);

    await executeGeneration({
      messageText,
      imageBase64: currentImage?.base64,
      imageMimeType: currentImage?.mimeType,
      sessionIdOverride: activeSessionId,
    });
  };

  const handleRegenerate = async (assistantIndex) => {
    if (loading) return;
    const list = messagesBySession[currentSessionId] || [];
    if (!list[assistantIndex] || list[assistantIndex].role !== "assistant") return;

    // Find the preceding user message
    let precedingUserMsg = null;
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (list[i].role === "user") {
        precedingUserMsg = list[i];
        break;
      }
    }
    if (!precedingUserMsg) return;

    // Reset this assistant message to a streaming placeholder
    setMessagesBySession((prev) => {
      const currentList = prev[currentSessionId] || [];
      const updated = [...currentList];
      updated[assistantIndex] = {
        role: "assistant",
        content: "",
        tool_used: null,
        sources: [],
        isStreaming: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      return { ...prev, [currentSessionId]: updated };
    });

    let rawB64 = null;
    if (precedingUserMsg.image && precedingUserMsg.image.includes(",")) {
      rawB64 = precedingUserMsg.image.split(",")[1];
    }

    await executeGeneration({
      messageText: precedingUserMsg.content,
      imageBase64: rawB64,
      imageMimeType: null,
      targetAssistantIndex: assistantIndex,
      sessionIdOverride: currentSessionId,
    });
  };

  const handleContinueGenerating = async (targetIndex = null) => {
    if (loading) return;

    const list = messagesBySession[currentSessionId] || [];
    if (list.length === 0) return;

    let assistantIndex = targetIndex;
    if (assistantIndex === null || assistantIndex === undefined) {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].role === "assistant") {
          assistantIndex = i;
          break;
        }
      }
    }
    if (assistantIndex === null || assistantIndex === undefined || assistantIndex < 0) return;

    const assistantMsg = list[assistantIndex];
    if (!assistantMsg) return;

    let userMsg = null;
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (list[i].role === "user") {
        userMsg = list[i];
        break;
      }
    }
    if (!userMsg) return;

    const previousContent = (assistantMsg.content || "").trim();

    setMessagesBySession((prev) => {
      const currentList = prev[currentSessionId] || [];
      const updated = [...currentList];
      if (updated[assistantIndex]) {
        updated[assistantIndex] = {
          ...updated[assistantIndex],
          isStreaming: true,
          isStopped: false,
        };
      }
      return { ...prev, [currentSessionId]: updated };
    });

    let rawB64 = null;
    if (userMsg.image && userMsg.image.includes(",")) {
      rawB64 = userMsg.image.split(",")[1];
    }

    const continuePrompt = previousContent
      ? `The previous response was paused or stopped midway at this point:\n"""\n${previousContent.slice(-300)}\n"""\nPlease continue generating the rest of the response seamlessly from where it stopped. Do not repeat what was already written.`
      : userMsg.content;

    await executeGeneration({
      messageText: continuePrompt,
      imageBase64: rawB64,
      imageMimeType: null,
      targetAssistantIndex: assistantIndex,
      initialTextToAppend: previousContent,
      sessionIdOverride: currentSessionId,
    });
  };

  const handleEditMessage = async (userIndex, newContent) => {
    if (loading) {
      handleStopGenerating();
    }
    const list = messagesBySession[currentSessionId] || [];
    if (!list[userIndex] || list[userIndex].role !== "user") return;

    const trimmed = newContent.trim();
    if (!trimmed) return;

    const updatedUserMsg = {
      ...list[userIndex],
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantPlaceholder = {
      role: "assistant",
      content: "",
      tool_used: null,
      sources: [],
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Truncate conversation to this user message + placeholder
    const truncated = [...list.slice(0, userIndex), updatedUserMsg, assistantPlaceholder];

    setMessagesBySession((prev) => ({
      ...prev,
      [currentSessionId]: truncated,
    }));

    let rawB64 = null;
    if (updatedUserMsg.image && updatedUserMsg.image.includes(",")) {
      rawB64 = updatedUserMsg.image.split(",")[1];
    }

    await executeGeneration({
      messageText: trimmed,
      imageBase64: rawB64,
      imageMimeType: null,
      targetAssistantIndex: userIndex + 1,
      sessionIdOverride: currentSessionId,
    });
  };

  const handleSelectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    setSessionSwitchCount((c) => c + 1);
    setActiveMainView("chat");
    if (!messagesBySession[sessionId]) {
      try {
        const msgs = await fetchSessionMessages(sessionId);
        setMessagesBySession((prev) => ({ ...prev, [sessionId]: msgs }));
      } catch (err) {
        console.error("Failed to fetch messages for session:", err);
      }
    }
  };

  const handleNewSession = async () => {
    setActiveMainView("chat");
    setSessionSwitchCount((c) => c + 1);
    try {
      const newSession = await createSession();
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessagesBySession((prev) => ({ ...prev, [newSession.id]: [] }));
      setSelectedDocId(null);
      setInput("");
    } catch (err) {
      console.error("Failed to create new session:", err);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      setMessagesBySession((prev) => {
        const copy = { ...prev };
        delete copy[sessionId];
        return copy;
      });

      if (currentSessionId === sessionId) {
        if (remaining.length > 0) {
          handleSelectSession(remaining[0].id);
        } else {
          handleNewSession();
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    if (!newTitle || !newTitle.trim()) return;
    try {
      const updated = await updateSession(sessionId, { title: newTitle.trim() });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: updated.title } : s))
      );
    } catch (err) {
      console.error("Failed to rename session:", err);
    }
  };

  const handleTogglePinSession = async (sessionId, currentPinned) => {
    try {
      const updated = await updateSession(sessionId, { is_pinned: !currentPinned });
      setSessions((prev) => {
        const mapped = prev.map((s) =>
          s.id === sessionId ? { ...s, is_pinned: updated.is_pinned } : s
        );
        return mapped.sort((a, b) => {
          if (b.is_pinned !== a.is_pinned) return (b.is_pinned || 0) - (a.is_pinned || 0);
          return (b.updated_at || 0) - (a.updated_at || 0);
        });
      });
    } catch (err) {
      console.error("Failed to toggle pin session:", err);
    }
  };

  const handleUploadDocument = async (file) => {
    const res = await uploadDocument(file);
    // Refresh documents list
    const docs = await fetchDocuments();
    setDocuments(docs);
    // Auto-select uploaded doc
    setSelectedDocId(res.document_id);
    return res;
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await deleteDocument(docId);
      if (selectedDocId === docId) setSelectedDocId(null);
      if (activeCitation?.document_id === docId) setActiveCitation(null);
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("Delete document failed:", err);
    }
  };

  const handleClearMessages = () => {
    setMessagesBySession((prev) => ({
      ...prev,
      [currentSessionId]: [],
    }));
  };

  const handleCreateArtifactFromTemplate = (templateType, promptText) => {
    setActiveMainView("chat");
    const targetPrompt =
      promptText ||
      (templateType === "slides"
        ? "Create an interactive presentation deck on: "
        : templateType === "docs"
        ? "Write a technical specification document for: "
        : "Build an interactive web application for: ");
    setInput(targetPrompt);
    setTimeout(() => {
      const textarea = document.querySelector(".claude-composer-textarea");
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = textarea.value.length;
        textarea.selectionEnd = textarea.value.length;
      }
    }, 60);
  };

  return (
    <div className={`app-container ${activeCitation ? "has-doc-viewer" : ""}`}>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-backdrop fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container (Static on Desktop, Slide-over Drawer on Mobile) */}
      <div className={`sidebar-container-wrapper ${isMobileSidebarOpen ? "mobile-drawer-open" : ""}`}>
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            handleSelectSession(id);
            setIsMobileSidebarOpen(false);
          }}
          onNewSession={() => {
            handleNewSession();
            setIsMobileSidebarOpen(false);
          }}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onTogglePinSession={handleTogglePinSession}
          documents={documents}
          onUploadDocument={handleUploadDocument}
          onDeleteDocument={handleDeleteDocument}
          selectedDocId={selectedDocId}
          onSelectDocId={setSelectedDocId}
          tools={tools}
          backendStatus={backendStatus}
          onOpenStudio={() => {
            handleOpenStudio();
            setIsMobileSidebarOpen(false);
          }}
          onOpenArtifacts={() => {
            setActiveMainView("artifacts");
            setIsMobileSidebarOpen(false);
          }}
          onOpenCode={() => {
            setActiveMainView("code");
            setIsMobileSidebarOpen(false);
          }}
          onOpenCreate={() => {
            setActiveMainView("create");
            setIsMobileSidebarOpen(false);
          }}
          onOpenSlides={() => {
            setActiveMainView("chat");
            setActiveSlideDeck(DEFAULT_FOOTBALL_DECK);
            setIsSlideSplitView(true);
            setIsMobileSidebarOpen(false);
          }}
          onOpenChat={() => {
            setActiveMainView("chat");
            setIsMobileSidebarOpen(false);
          }}
          onOpenCustomInstructions={() => {
            setShowInstructionsModal(true);
            setIsMobileSidebarOpen(false);
          }}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          activeMainView={activeMainView}
        />
      </div>

      <div className="main-workspace-area">
        {/* ChatGPT Style Mobile Header Bar */}
        <div className="chatgpt-mobile-top-bar">
          <button
            type="button"
            className="btn-chatgpt-mobile-menu"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>

          <div
            className="chatgpt-mobile-title-wrap"
            onClick={() => {
              setActiveMainView("chat");
              setIsMobileSidebarOpen(false);
            }}
          >
            <img src="/logo.png" alt="Logo" className="chatgpt-mobile-logo" />
            <span className="chatgpt-mobile-title">JohnGPT</span>
          </div>

          <button
            type="button"
            className="btn-chatgpt-mobile-new"
            onClick={() => {
              setActiveMainView("chat");
              handleNewSession();
              setIsMobileSidebarOpen(false);
            }}
            aria-label="New conversation"
          >
            <SquarePen size={20} />
          </button>
        </div>
        {activeMainView === "studio" || activeMainView === "code" ? (
          <CodeStudio
            onClose={() => setActiveMainView("chat")}
            selectedModel={selectedModel}
            initialArtifact={activeStudioArtifact}
          />
        ) : activeMainView === "artifacts" ? (
          <Artifacts
            onClose={() => setActiveMainView("chat")}
            onOpenArtifact={handleOpenArtifact}
            onSelectTemplate={handleCreateArtifactFromTemplate}
          />
        ) : activeMainView === "create" ? (
          <ImageStudio
            onClose={() => setActiveMainView("chat")}
            onSendToChat={(imgUrl, prompt) => {
              setActiveMainView("chat");
              setAttachedImage(imgUrl);
              setInput(prompt ? `Analyze this generated image: "${prompt}"` : "Analyze this image");
            }}
          />
        ) : (
          <div className={`chat-workspace-wrapper ${activeArtifact ? "split-slides-active" : ""}`}>
            <div className="split-chat-pane">
              <ChatArea
                messages={currentMessages}
                input={input}
                setInput={setInput}
                sessionSwitchCount={sessionSwitchCount}
                onSend={handleSend}
                onStopGenerating={handleStopGenerating}
                onContinueGenerating={handleContinueGenerating}
                onRegenerate={handleRegenerate}
                onEditMessage={handleEditMessage}
                onViewCitation={setActiveCitation}
                loading={loading}
                selectedDoc={selectedDoc}
                onClearSelectedDoc={() => setSelectedDocId(null)}
                currentSessionId={currentSessionId}
                onUploadDocument={handleUploadDocument}
                onClearMessages={handleClearMessages}
                attachedImage={attachedImage}
                setAttachedImage={setAttachedImage}
                onOpenCustomInstructions={() => setShowInstructionsModal(true)}
                hasCustomInstructions={Boolean(
                  customInstructions?.enabled &&
                    (customInstructions?.aboutUser?.trim() || customInstructions?.responseStyle?.trim())
                )}
                onOpenVoiceMode={() => setShowVoiceModeModal(true)}
                onOpenStudio={() => handleOpenStudio()}
                onOpenSlideDeck={(deck) => handleOpenArtifact({ type: "slides", title: deck?.title || "Presentation", data: deck || DEFAULT_FOOTBALL_DECK })}
                onOpenArtifact={handleOpenArtifact}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
              />
            </div>
            {activeArtifact && (
              <div className={`split-slides-pane ${!isArtifactSplitView ? "fullscreen-pane" : ""}`}>
                {activeArtifact.type === "slides" ? (
                  <SlideStudio
                    deck={activeArtifact.data || activeArtifact}
                    isSplitView={isArtifactSplitView}
                    onToggleSplitView={() => setIsArtifactSplitView(!isArtifactSplitView)}
                    onClose={() => setActiveArtifact(null)}
                  />
                ) : activeArtifact.type === "doc" ? (
                  <DocStudio
                    doc={activeArtifact.data || activeArtifact}
                    isSplitView={isArtifactSplitView}
                    onToggleSplitView={() => setIsArtifactSplitView(!isArtifactSplitView)}
                    onClose={() => setActiveArtifact(null)}
                  />
                ) : (
                  <AppStudio
                    app={activeArtifact.data || activeArtifact}
                    isSplitView={isArtifactSplitView}
                    onToggleSplitView={() => setIsArtifactSplitView(!isArtifactSplitView)}
                    onClose={() => setActiveArtifact(null)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {activeCitation && (
        <DocumentViewer
          citation={activeCitation}
          onClose={() => setActiveCitation(null)}
        />
      )}

      <CustomInstructionsModal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        initialData={customInstructions}
        onSave={setCustomInstructions}
      />

      <VoiceModeModal
        isOpen={showVoiceModeModal}
        onClose={() => setShowVoiceModeModal(false)}
        onSendMessage={(spokenText) => handleSend(spokenText)}
        loading={loading}
        currentMessages={currentMessages}
      />
    </div>
  );
}
