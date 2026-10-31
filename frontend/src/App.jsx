import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import DocumentViewer from "./components/DocumentViewer";
import CustomInstructionsModal from "./components/CustomInstructionsModal";
import VoiceModeModal from "./components/VoiceModeModal";
import Artifacts from "./components/Artifacts";
import CodeStudio from "./components/CodeStudio";
import ImageStudio from "./components/ImageStudio";
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

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [messagesBySession, setMessagesBySession] = useState({});

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
          const activeId = backendSessions[0].id;
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
  }) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    let streamedText = "";
    let lastTool = null;
    const targetSessionId = currentSessionId;
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
          setMessagesBySession((prev) => {
            const list = prev[targetSessionId] || [];
            const idx = targetAssistantIndex !== undefined ? targetAssistantIndex : list.length - 1;
            if (!list[idx]) return prev;
            const updated = [...list];
            updated[idx] = {
              ...updated[idx],
              content: combineText(initialTextToAppend, finalPiece),
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
        setMessagesBySession((prev) => {
          const list = prev[targetSessionId] || [];
          const idx = targetAssistantIndex !== undefined ? targetAssistantIndex : list.length - 1;
          if (!list[idx]) return prev;
          const updated = [...list];
          updated[idx] = {
            ...updated[idx],
            content:
              (streamedText ? streamedText + "\n\n" : "") +
              `⚠️ **Error:** ${err.message || "Failed to complete stream."}`,
            isStreaming: false,
          };
          return { ...prev, [targetSessionId]: updated };
        });
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const handleSend = async (overrideText = null) => {
    const text = (typeof overrideText === "string" ? overrideText : input).trim();
    if ((!text && !attachedImage) || loading) return;

    const messageText = text || (attachedImage ? "Please analyze this image." : "");
    const currentImage = attachedImage;

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
    if (currentMessages.length === 0) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, title: messageText.length > 28 ? messageText.substring(0, 28) + "..." : messageText }
            : s
        )
      );
    }

    setMessagesBySession((prev) => ({
      ...prev,
      [currentSessionId]: [
        ...(prev[currentSessionId] || []),
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
    });
  };

  const handleSelectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
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
    setInput(promptText);
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
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
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
        onOpenStudio={() => handleOpenStudio()}
        onOpenArtifacts={() => setActiveMainView("artifacts")}
        onOpenCode={() => setActiveMainView("code")}
        onOpenCreate={() => setActiveMainView("create")}
        onOpenChat={() => setActiveMainView("chat")}
        onOpenCustomInstructions={() => setShowInstructionsModal(true)}
        activeMainView={activeMainView}
      />

      <div className="main-workspace-area">
        {activeMainView === "studio" || activeMainView === "code" ? (
          <CodeStudio
            onClose={() => setActiveMainView("chat")}
            selectedModel={selectedModel}
            initialArtifact={activeStudioArtifact}
          />
        ) : activeMainView === "artifacts" ? (
          <Artifacts
            onClose={() => setActiveMainView("chat")}
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
          <ChatArea
            messages={currentMessages}
            input={input}
            setInput={setInput}
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
            onAttachClick={() => {
              document.querySelector(".upload-box")?.click();
            }}
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
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
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
