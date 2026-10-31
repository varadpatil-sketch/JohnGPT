
import json
import mimetypes
import os
from pathlib import Path
from fastapi import FastAPI, File, HTTPException, UploadFile, Request
from fastapi.responses import FileResponse, StreamingResponse

from app.agent import (
    run_agent,
    run_agent_stream,
    rewrite_query,
    user_requested_sources,
    generate_session_title,
)
from app.memory import (
    add_message,
    get_history,
    get_messages,
    list_sessions,
    get_session,
    create_or_get_session,
    update_session,
    delete_session,
)
from app.rag import (
    ingest_document,
    ingest_pdf,
    list_documents,
    retrieve,
    get_document_file,
    get_document_page_text,
    delete_document,
)
from app.schemas import (
    ChatRequest,
    ChatResponse,
    Source,
    UploadResponse,
    CreateSessionRequest,
    UpdateSessionRequest,
    GenerateImageRequest,
    GenerateImageResponse,
)
from app.image_gen import generate_image_pipeline
from app.security import validate_document, validate_pdf, validate_document_id

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="JohnGPT AI Assistant",
    description="Tool-calling AI assistant with conversational RAG",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def handle_api_prefix(request: Request, call_next):
    """Ensure both /api/... and direct /... routes resolve cleanly on Vercel and local."""
    path = request.scope.get("path", "")
    if path.startswith("/api/"):
        request.scope["path"] = path[4:]
    elif path == "/api":
        request.scope["path"] = "/"
    return await call_next(request)


def get_frontend_dist():
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
        Path("frontend/dist"),
        Path("dist"),
        Path("/app/frontend/dist"),
    ]
    for c in candidates:
        if c.exists() and (c / "index.html").exists():
            return c
    return None


@app.get("/")
def home():
    dist = get_frontend_dist()
    if dist and (dist / "index.html").exists():
        return FileResponse(dist / "index.html")
    return {
        "assistant": "JohnGPT",
        "message": "JohnGPT AI backend is running.",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "assistant": "JohnGPT",
    }


# ==============================================================================
# MULTI-CHAT SESSIONS MANAGEMENT (POINT 1)
# ==============================================================================
def is_studio_session(session_id: str) -> bool:
    if not session_id:
        return False
    sid = str(session_id).lower()
    return "studio" in sid or sid.startswith("ephemeral")


@app.get("/sessions")
def get_all_sessions():
    """Retrieve all conversations, sorted by pinned first, then recently updated."""
    return {"sessions": [s for s in list_sessions() if not is_studio_session(s.get("id", ""))]}


@app.post("/sessions")
def create_new_session(request: CreateSessionRequest):
    """Create a new chat conversation."""
    import uuid
    session_id = request.id or f"session-{uuid.uuid4().hex[:8]}"
    session = create_or_get_session(session_id, request.title or "New Conversation")
    return session


@app.get("/sessions/{session_id}")
def get_single_session(session_id: str):
    if is_studio_session(session_id):
        raise HTTPException(status_code=404, detail="Studio sessions are ephemeral")
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: str):
    """Retrieve full message history for a conversation."""
    if is_studio_session(session_id):
        return {"messages": []}
    return {"messages": get_messages(session_id)}


@app.patch("/sessions/{session_id}")
def update_existing_session(session_id: str, request: UpdateSessionRequest):
    """Rename a conversation or toggle its pinned status."""
    updated = update_session(session_id, title=request.title, is_pinned=request.is_pinned)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated


@app.delete("/sessions/{session_id}")
def remove_session(session_id: str):
    """Delete a conversation and all its messages."""
    success = delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True, "session_id": session_id}


@app.get("/tools")
def list_tools():
    return {
        "tools": [
            {
                "name": "calculate",
                "description": "Calculate a basic arithmetic expression",
            },
            {
                "name": "get_current_datetime",
                "description": "Get the current date, time, and weekday across timezones",
            },
            {
                "name": "get_weather",
                "description": "Get current weather conditions and temperature worldwide",
            },
            {
                "name": "web_search",
                "description": "Search the live web for recent events, news, and facts",
            },
        ]
    }


@app.get("/documents")
def get_documents():
    try:
        return {"documents": list_documents()}
    except Exception as error:
        print(f"Document listing error: {type(error).__name__}")
        raise HTTPException(
            status_code=500,
            detail="Could not list documents.",
        ) from error


@app.post("/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    max_bytes = 15 * 1024 * 1024

    try:
        # Read one byte beyond the limit to detect oversized uploads.
        content = await file.read(max_bytes + 1)

        if len(content) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail="File must be 15 MB or smaller.",
            )

        filename, _ = validate_document(file.filename or "", content)
        result = ingest_document(content, filename)

        return UploadResponse(**result)

    except HTTPException:
        raise
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error
    except Exception as error:
        print(f"File processing error: {type(error).__name__} - {error}")
        raise HTTPException(
            status_code=500,
            detail="Could not process the uploaded file.",
        ) from error
    finally:
        await file.close()


@app.get("/documents/{document_id}/file")
def get_file(document_id: str):
    """Serve the raw uploaded document file for inline browser viewing."""
    found = get_document_file(document_id)
    if not found:
        raise HTTPException(
            status_code=404,
            detail="Document file not found on server.",
        )
    file_path, filename = found
    mime_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=mime_type or "application/octet-stream",
        content_disposition_type="inline",
    )


@app.get("/documents/{document_id}/page/{page}")
def get_page(document_id: str, page: int):
    """Retrieve text and chunks belonging to a specific page or section."""
    data = get_document_page_text(document_id, page)
    return data


@app.delete("/documents/{document_id}")
def remove_document(document_id: str):
    """Delete an indexed document from vector store, BM25 index, and disk."""
    success = delete_document(document_id)
    return {"success": success, "document_id": document_id}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    try:
        document_id = validate_document_id(request.document_id)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    # Load recent conversation history.
    history = get_history(request.session_id)

    history_text = "\n".join(
        f"{item['role']}: {item['content']}"
        for item in history
    )

    try:
        # Rewrite follow-up questions for better document retrieval.
        search_query = rewrite_query(
            message=message,
            history_text=history_text,
        )

        # Retrieve relevant passages from the indexed PDFs.
        passages = retrieve(
            query=search_query,
            document_id=document_id,
            top_k=5,
        )

        show_sources = user_requested_sources(message)
        context_parts = []
        sources = []

        for item in passages:
            metadata = item["metadata"]
            filename = metadata["filename"]
            page = metadata["page"]

            if show_sources:
                context_parts.append(
                    f"[Source: {filename}, page {page}]\n"
                    f"{item['text']}"
                )
                sources.append(
                    Source(
                        document_id=metadata["document_id"],
                        page=page,
                        text=item["text"],
                        filename=filename,
                        score=metadata.get("score"),
                        search_type=metadata.get("search_type", "hybrid"),
                    )
                )
            else:
                context_parts.append(
                    f"Passage:\n{item['text']}"
                )

        rag_context = "\n\n".join(context_parts)

        # Handle optional attached image (Multimodal Vision)
        image_bytes = None
        image_mime_type = request.image_mime_type or "image/jpeg"
        if request.image_base64:
            import base64
            raw_b64 = request.image_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            try:
                image_bytes = base64.b64decode(raw_b64)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {e}")

        # Run Gemini and any approved tool calls.
        result = run_agent(
            message=message,
            history_text=history_text,
            rag_context=rag_context,
            image_bytes=image_bytes,
            image_mime_type=image_mime_type,
            show_sources=show_sources,
            custom_instructions=request.custom_instructions,
            model=request.model,
        )

        answer = result["answer"]

    except Exception as error:
        print(f"Chat processing error: {type(error).__name__}")
        raise HTTPException(
            status_code=502,
            detail="JohnGPT could not process your request.",
        ) from error

    # Check if session needs an auto-generated title
    session_info = get_session(request.session_id)
    new_title = None
    if not session_info or session_info["title"] == "New Conversation":
        new_title = generate_session_title(message)
        update_session(request.session_id, title=new_title)

    # Save the exchange after a successful response.
    stored_user_msg = f"[Image Attached] {message}" if request.image_base64 else message
    add_message(request.session_id, "user", stored_user_msg)
    sources_dicts = [s.model_dump() if hasattr(s, "model_dump") else s.__dict__ for s in sources]
    add_message(request.session_id, "assistant", answer, tool_used=result["tool_used"], sources=sources_dicts)

    return ChatResponse(
        session_id=request.session_id,
        answer=answer,
        tool_used=result["tool_used"],
        sources=sources,
        new_title=new_title,
    )


@app.post("/chat/stream")
def chat_stream(request: ChatRequest):
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    try:
        document_id = validate_document_id(request.document_id)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    # Load recent conversation history.
    history = get_history(request.session_id)

    history_text = "\n".join(
        f"{item['role']}: {item['content']}"
        for item in history
    )

    try:
        # Rewrite follow-up questions for better document retrieval.
        search_query = rewrite_query(
            message=message,
            history_text=history_text,
        )

        # Retrieve relevant passages from the indexed documents.
        passages = retrieve(
            query=search_query,
            document_id=document_id,
            top_k=5,
        )

        show_sources = user_requested_sources(message)
        context_parts = []
        sources = []

        for item in passages:
            metadata = item["metadata"]
            filename = metadata["filename"]
            page = metadata["page"]

            if show_sources:
                context_parts.append(
                    f"[Source: {filename}, page {page}]\n"
                    f"{item['text']}"
                )
                sources.append(
                    {
                        "document_id": metadata["document_id"],
                        "page": page,
                        "text": item["text"],
                        "filename": filename,
                        "score": metadata.get("score"),
                        "search_type": metadata.get("search_type", "hybrid"),
                    }
                )
            else:
                context_parts.append(
                    f"Passage:\n{item['text']}"
                )

        rag_context = "\n\n".join(context_parts)

        # Handle optional attached image (Multimodal Vision)
        image_bytes = None
        image_mime_type = request.image_mime_type or "image/jpeg"
        if request.image_base64:
            import base64
            raw_b64 = request.image_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            try:
                image_bytes = base64.b64decode(raw_b64)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {e}")

    except Exception as error:
        print(f"Chat stream preparation error: {type(error).__name__} - {error}")
        raise HTTPException(
            status_code=502,
            detail="JohnGPT could not process your request.",
        ) from error

    def event_generator():
        full_answer = ""
        tool_used = None
        try:
            for event in run_agent_stream(
                message=message,
                history_text=history_text,
                rag_context=rag_context,
                image_bytes=image_bytes,
                image_mime_type=image_mime_type,
                show_sources=show_sources,
                custom_instructions=request.custom_instructions,
                model=request.model,
            ):
                if event["type"] == "token":
                    full_answer += event["text"]
                    yield f"data: {json.dumps(event)}\n\n"
                elif event["type"] in ("tool_start", "tool_done"):
                    yield f"data: {json.dumps(event)}\n\n"
                elif event["type"] == "done":
                    final_answer = event.get("answer") or full_answer
                    tool_used = event.get("tool_used")

                    # Check if session needs auto-titling
                    session_info = get_session(request.session_id)
                    new_title = None
                    if not session_info or session_info["title"] == "New Conversation":
                        new_title = generate_session_title(message)
                        update_session(request.session_id, title=new_title)

                    done_payload = {
                        "type": "done",
                        "answer": final_answer,
                        "tool_used": tool_used,
                        "sources": sources,
                        "session_id": request.session_id,
                        "new_title": new_title,
                    }
                    yield f"data: {json.dumps(done_payload)}\n\n"

                    # Save to conversation memory
                    stored_user_msg = f"[Image Attached] {message}" if request.image_base64 else message
                    add_message(request.session_id, "user", stored_user_msg)
                    add_message(request.session_id, "assistant", final_answer, tool_used=tool_used, sources=sources)
        except Exception as err:
            err_msg = str(err)
            print(f"Streaming error: {err_msg}")
            friendly_err = (
                "The connection to the AI model was momentarily interrupted. Please click 'Regenerate' to resume."
                if any(k in err_msg.lower() for k in ("wsarecv", "forcibly closed", "stream reading error", "remote host"))
                else err_msg
            )
            yield f"data: {json.dumps({'type': 'error', 'error': friendly_err})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/images/generate", response_model=GenerateImageResponse)
@app.post("/api/images/generate", response_model=GenerateImageResponse)
def generate_image_endpoint(request: GenerateImageRequest):
    """
    Generate high-quality images from text description.
    Uses Google Nano Banana Pro / Gemini Image on Pro plan,
    or resilient visual neural synthesis fallback.
    """
    try:
        result = generate_image_pipeline(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio or "1:1",
            style=request.style,
            model=request.model,
        )
        return GenerateImageResponse(**result)
    except Exception as e:
        print(f"Image generation endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Image generation failed: {str(e)}",
        )


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    dist = get_frontend_dist()
    if dist:
        file_path = dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        index_file = dist / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Not found")
