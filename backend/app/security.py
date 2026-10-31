import re
from pathlib import Path

SUPPORTED_EXTENSIONS = {
    # Rich documents
    ".pdf",
    ".docx",
    # Text & Markdown
    ".txt",
    ".md",
    ".markdown",
    ".log",
    # Structured Data & Config
    ".csv",
    ".tsv",
    ".json",
    ".yaml",
    ".yml",
    ".xml",
    # Code Files
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".html",
    ".css",
    ".sql",
    ".sh",
    ".env",
}


def validate_document(filename: str, content: bytes) -> tuple[str, str]:
    """
    Validate uploaded document filename, extension, and content integrity.
    Returns (clean_filename, extension).
    """
    if not filename:
        raise ValueError("Filename is required.")

    path_obj = Path(filename)
    clean_name = path_obj.name
    # Remove path traversal and dangerous characters
    clean_name = re.sub(r"[^\w\-.]", "_", clean_name)
    ext = Path(clean_name).suffix.lower()

    if ext not in SUPPORTED_EXTENSIONS:
        supported_list = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise ValueError(
            f"Unsupported file format '{ext}'. Supported formats: {supported_list}"
        )

    if len(content) == 0:
        raise ValueError("Uploaded file is empty.")

    # Format specific integrity checks
    if ext == ".pdf":
        if not content.startswith(b"%PDF-"):
            raise ValueError("Uploaded file is not a valid PDF.")

    elif ext == ".docx":
        # DOCX is a zip package starting with PK\x03\x04
        if not content.startswith(b"PK\x03\x04"):
            raise ValueError("Uploaded file is not a valid Word document (.docx).")

    else:
        # Text, Code, CSV, JSON check - must be decodable text
        try:
            content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                content.decode("latin-1")
            except Exception:
                raise ValueError(f"Could not parse text encoding for '{clean_name}'.")

    return clean_name, ext


def validate_pdf(filename: str, content: bytes) -> str:
    """Backwards-compatible alias for validate_document targeting PDFs."""
    clean_name, _ = validate_document(filename, content)
    return clean_name


def validate_document_id(document_id: str | None) -> str | None:
    """Validate document_id format if provided."""
    if not document_id:
        return None

    document_id = document_id.strip()
    if not document_id:
        return None

    if not re.match(r"^[a-zA-Z0-9_\-]{1,100}$", document_id):
        raise ValueError("Invalid document ID format.")

    return document_id
