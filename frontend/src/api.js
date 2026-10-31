const API_BASE = import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? "http://127.0.0.1:8010" : "");

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

export async function fetchTools() {
  try {
    const res = await fetch(`${API_BASE}/tools`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.tools || [];
  } catch (err) {
    console.warn("Could not fetch tools:", err);
    return [];
  }
}

export async function fetchDocuments() {
  try {
    const res = await fetch(`${API_BASE}/documents`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.documents || [];
  } catch (err) {
    console.warn("Could not fetch documents:", err);
    return [];
  }
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(errData.detail || "Upload failed");
  }

  return await res.json();
}

export async function deleteDocument(documentId) {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete document");
  }
  return await res.json();
}

export async function fetchDocumentPage(documentId, page) {
  const res = await fetch(`${API_BASE}/documents/${documentId}/page/${page}`);
  if (!res.ok) {
    return { content: "" };
  }
  return await res.json();
}

export function getDocumentFileUrl(documentId) {
  return `${API_BASE}/documents/${documentId}/file`;
}

export async function sendChatMessage({
  message,
  session_id,
  document_id = null,
  image_base64 = null,
  image_mime_type = null,
  custom_instructions = null,
  model = null,
}) {
  const payload = {
    message,
    session_id,
  };
  if (document_id) {
    payload.document_id = document_id;
  }
  if (image_base64) {
    payload.image_base64 = image_base64;
    payload.image_mime_type = image_mime_type || "image/jpeg";
  }
  if (custom_instructions) {
    payload.custom_instructions = custom_instructions;
  }
  if (model) {
    payload.model = model;
  }

  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Chat request failed" }));
    throw new Error(errData.detail || "Server error");
  }

  return await res.json();
}

export async function streamChatMessage({
  message,
  session_id,
  document_id = null,
  image_base64 = null,
  image_mime_type = null,
  custom_instructions = null,
  model = null,
  signal = null,
  onToken,
  onTool,
  onDone,
  onError,
}) {
  const payload = {
    message,
    session_id,
  };
  if (document_id) {
    payload.document_id = document_id;
  }
  if (image_base64) {
    payload.image_base64 = image_base64;
    payload.image_mime_type = image_mime_type || "image/jpeg";
  }
  if (custom_instructions) {
    payload.custom_instructions = custom_instructions;
  }
  if (model) {
    payload.model = model;
  }

  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Chat stream failed" }));
    throw new Error(errData.detail || `Server returned ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop(); // Keep incomplete piece in buffer

      for (const raw of events) {
        const line = raw.trim();
        if (!line || !line.startsWith("data: ")) continue;
        const jsonStr = line.replace(/^data:\s*/, "");
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === "token") {
            if (onToken) onToken(event.text);
          } else if (event.type === "tool_start" || event.type === "tool_done") {
            if (onTool) onTool(event);
          } else if (event.type === "done") {
            if (onDone) onDone(event);
          } else if (event.type === "error") {
            if (onError) onError(new Error(event.error));
          }
        } catch (e) {
          console.warn("Could not parse SSE JSON:", jsonStr, e);
        }
      }
    }
  } catch (err) {
    if (err.name === "AbortError") {
      return;
    }
    if (onError) onError(err);
    throw err;
  }
}

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.sessions || [];
}

export async function createSession(sessionId = null, title = "New Conversation") {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: sessionId, title }),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return await res.json();
}

export async function fetchSessionMessages(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages || [];
}

export async function updateSession(sessionId, { title, is_pinned }) {
  const payload = {};
  if (title !== undefined) payload.title = title;
  if (is_pinned !== undefined) payload.is_pinned = is_pinned;

  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update conversation");
  return await res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
  return await res.json();
}

