from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str = Field(min_length=1, max_length=100)
    document_id: str | None = None
    image_base64: str | None = None
    image_mime_type: str | None = None
    custom_instructions: str | None = None
    model: str | None = None


class Source(BaseModel):
    document_id: str
    page: int
    text: str
    filename: str | None = None
    score: float | None = None
    search_type: str | None = "hybrid"


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    tool_used: str | None = None
    sources: list[Source] = []
    new_title: str | None = None


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    chunks_created: int


class CreateSessionRequest(BaseModel):
    id: str | None = None
    title: str | None = "New Conversation"


class UpdateSessionRequest(BaseModel):
    title: str | None = None
    is_pinned: bool | None = None