import csv
import io
import json
import re
import uuid
import os
from pathlib import Path
import chromadb
import docx
try:
    import pypdf
except ImportError:
    pypdf = None
from rank_bm25 import BM25Okapi

DATA_DIR = Path(os.getenv("DATA_DIR", "/tmp/data" if os.getenv("VERCEL") else "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

DOCUMENTS_DIR = DATA_DIR / "documents"
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

chroma_client = chromadb.PersistentClient(path=str(DATA_DIR / "chroma"))
collection = chroma_client.get_or_create_collection(
    name="documents",
    metadata={"hnsw:space": "cosine"},
)


def chunk_words(text: str, chunk_size: int = 500, overlap: int = 80) -> list[str]:
    """Split text into overlapping chunks by word boundaries."""
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk.strip())
        if end >= len(words):
            break
        start += chunk_size - overlap

    return chunks


def extract_chunks(content: bytes, filename: str) -> list[tuple[str, int]]:
    """
    Extract text chunks and section/page numbers from any supported file format.
    Returns a list of (text_chunk, page_or_section_number).
    """
    ext = Path(filename).suffix.lower()
    items = []

    # 1. PDF Documents
    if ext == ".pdf":
        if pypdf is not None:
            reader = pypdf.PdfReader(io.BytesIO(content))
            for page_index, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                page_num = page_index + 1
                for chunk in chunk_words(page_text):
                    items.append((chunk, page_num))
        else:
            try:
                import pymupdf
                doc = pymupdf.open(stream=content, filetype="pdf")
                for page_index in range(len(doc)):
                    page_text = doc[page_index].get_text()
                    page_num = page_index + 1
                    for chunk in chunk_words(page_text):
                        items.append((chunk, page_num))
                doc.close()
            except ImportError:
                raise RuntimeError("No PDF library installed. Please install pypdf.")

    # 2. Microsoft Word Documents (.docx)
    elif ext == ".docx":
        doc = docx.Document(io.BytesIO(content))
        full_text_parts = []
        for p in doc.paragraphs:
            if p.text.strip():
                full_text_parts.append(p.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    full_text_parts.append(row_text)

        full_text = "\n\n".join(full_text_parts)
        chunks = chunk_words(full_text, chunk_size=400, overlap=60)
        for idx, chunk in enumerate(chunks):
            items.append((chunk, idx + 1))

    # 3. CSV / TSV Tabular Data
    elif ext in {".csv", ".tsv"}:
        delimiter = "\t" if ext == ".tsv" else ","
        try:
            text_data = content.decode("utf-8")
        except UnicodeDecodeError:
            text_data = content.decode("latin-1")

        reader = list(csv.reader(io.StringIO(text_data), delimiter=delimiter))
        if reader:
            headers = reader[0]
            header_str = " | ".join(headers)
            rows = reader[1:]
            step = 10
            for i in range(0, len(rows), step):
                chunk_rows = rows[i:i + step]
                lines = [f"Header: {header_str}"]
                for r in chunk_rows:
                    lines.append("Row: " + " | ".join(r))
                chunk_text = "\n".join(lines)
                page_num = (i // step) + 1
                items.append((chunk_text, page_num))

    # 4. JSON Files
    elif ext == ".json":
        try:
            text_data = content.decode("utf-8")
        except UnicodeDecodeError:
            text_data = content.decode("latin-1")

        try:
            parsed = json.loads(text_data)
            if isinstance(parsed, list):
                step = 5
                for i in range(0, len(parsed), step):
                    chunk_slice = parsed[i:i + step]
                    chunk_str = json.dumps(chunk_slice, indent=2)
                    items.append((chunk_str, (i // step) + 1))
            else:
                formatted = json.dumps(parsed, indent=2)
                for idx, chunk in enumerate(chunk_words(formatted, chunk_size=400, overlap=50)):
                    items.append((chunk, idx + 1))
        except Exception:
            for idx, chunk in enumerate(chunk_words(text_data)):
                items.append((chunk, idx + 1))

    # 5. Plain Text, Markdown, and Code files
    else:
        try:
            text_data = content.decode("utf-8")
        except UnicodeDecodeError:
            text_data = content.decode("latin-1", errors="replace")

        lines = text_data.splitlines()
        line_step = 34
        if len(lines) <= 40:
            if text_data.strip():
                items.append((text_data.strip(), 1))
        else:
            for i in range(0, len(lines), line_step):
                chunk_lines = lines[i:i + 40]
                chunk_str = "\n".join(chunk_lines).strip()
                if chunk_str:
                    items.append((chunk_str, (i // line_step) + 1))

    return items


# ==============================================================================
# ENTERPRISE HYBRID RETRIEVER (Dense Semantic + Sparse BM25 + Reciprocal Rank Fusion)
# ==============================================================================

class HybridRetriever:
    """
    Combines dense cosine vector search from ChromaDB with sparse BM25Okapi
    keyword search using Reciprocal Rank Fusion (RRF).
    """

    def __init__(self, chroma_collection):
        self.collection = chroma_collection
        self._bm25 = None
        self._corpus_ids = []
        self._corpus_docs = []
        self._corpus_metas = []
        self._dirty = True

    def mark_dirty(self):
        self._dirty = True

    def _ensure_index(self):
        if not self._dirty and self._bm25 is not None:
            return

        count = self.collection.count()
        if count == 0:
            self._bm25 = None
            self._corpus_ids = []
            self._corpus_docs = []
            self._corpus_metas = []
            self._dirty = False
            return

        data = self.collection.get(include=["documents", "metadatas"])
        self._corpus_ids = data.get("ids") or []
        self._corpus_docs = data.get("documents") or []
        self._corpus_metas = data.get("metadatas") or []

        tokenized_corpus = [
            re.findall(r"\w+", doc.lower()) if doc else []
            for doc in self._corpus_docs
        ]
        if tokenized_corpus:
            self._bm25 = BM25Okapi(tokenized_corpus)
        else:
            self._bm25 = None
        self._dirty = False

    def retrieve(
        self, query: str, document_id: str | None = None, top_k: int = 5
    ) -> list[dict]:
        clean_query = query.strip()
        if not clean_query:
            return []

        count = self.collection.count()
        if count == 0:
            return []

        self._ensure_index()

        dense_top_n = min(top_k * 3, count)
        where_filter = {"document_id": document_id} if document_id else None

        query_params = {
            "query_texts": [clean_query],
            "n_results": dense_top_n,
        }
        if where_filter:
            query_params["where"] = where_filter

        # 1. Dense Semantic Search
        dense_ranks = {}
        dense_docs_map = {}
        try:
            dense_res = self.collection.query(**query_params)
            dense_ids = (dense_res.get("ids") or [[]])[0]
            dense_docs = (dense_res.get("documents") or [[]])[0]
            dense_metas = (dense_res.get("metadatas") or [[]])[0]

            for rank, (cid, doc, meta) in enumerate(
                zip(dense_ids, dense_docs, dense_metas), start=1
            ):
                dense_ranks[cid] = rank
                dense_docs_map[cid] = (doc, meta)
        except Exception as error:
            print(f"Chroma dense query warning: {error}")

        # 2. Sparse BM25 Keyword Search
        sparse_ranks = {}
        sparse_docs_map = {}
        query_tokens = re.findall(r"\w+", clean_query.lower())

        if self._bm25 and query_tokens and self._corpus_docs:
            bm25_scores = self._bm25.get_scores(query_tokens)

            filtered_indices = []
            for idx, meta in enumerate(self._corpus_metas):
                if document_id and meta.get("document_id") != document_id:
                    continue
                score = bm25_scores[idx]
                if score > 0.001:
                    filtered_indices.append((idx, score))

            filtered_indices.sort(key=lambda x: x[1], reverse=True)

            for rank, (idx, _) in enumerate(filtered_indices[:dense_top_n], start=1):
                cid = self._corpus_ids[idx]
                sparse_ranks[cid] = rank
                sparse_docs_map[cid] = (self._corpus_docs[idx], self._corpus_metas[idx])

        # 3. Reciprocal Rank Fusion (RRF)
        all_candidate_ids = set(dense_ranks.keys()) | set(sparse_ranks.keys())
        if not all_candidate_ids:
            return []

        rrf_scores = {}
        K_RRF = 60

        for cid in all_candidate_ids:
            dense_r = dense_ranks.get(cid)
            sparse_r = sparse_ranks.get(cid)

            score = 0.0
            if dense_r is not None:
                score += 1.0 / (K_RRF + dense_r)
            if sparse_r is not None:
                score += 1.0 / (K_RRF + sparse_r)

            rrf_scores[cid] = score

        sorted_candidates = sorted(
            rrf_scores.items(), key=lambda x: x[1], reverse=True
        )
        top_candidates = sorted_candidates[:top_k]

        passages = []
        for cid, score in top_candidates:
            doc_data = dense_docs_map.get(cid) or sparse_docs_map.get(cid)
            if not doc_data:
                continue
            text, meta = doc_data
            passages.append({
                "text": text,
                "metadata": {
                    "document_id": meta.get("document_id", ""),
                    "filename": meta.get("filename", ""),
                    "page": int(meta.get("page", 1)),
                    "score": round(score, 4),
                    "search_type": "hybrid (dense + bm25)",
                },
            })

        return passages


# Singleton retriever instance
retriever = HybridRetriever(collection)


def ingest_document(content: bytes, filename: str) -> dict:
    """Extract, chunk, and index text from any supported document format."""
    document_id = uuid.uuid4().hex[:12]

    # Save original file to disk for side-by-side inspection
    doc_file_path = DOCUMENTS_DIR / f"{document_id}_{filename}"
    try:
        doc_file_path.write_bytes(content)
    except Exception as e:
        print(f"Warning: could not save raw document to disk: {e}")

    extracted = extract_chunks(content, filename)

    all_chunks = []
    all_metadatas = []
    all_ids = []

    for idx, (chunk_text, page_or_sec) in enumerate(extracted):
        if not chunk_text.strip():
            continue
        chunk_id = f"{document_id}_p{page_or_sec}_{idx}"
        all_chunks.append(chunk_text)
        all_metadatas.append({
            "document_id": document_id,
            "filename": filename,
            "page": int(page_or_sec),
        })
        all_ids.append(chunk_id)

    if all_chunks:
        batch_size = 300
        for b in range(0, len(all_chunks), batch_size):
            collection.add(
                documents=all_chunks[b:b + batch_size],
                metadatas=all_metadatas[b:b + batch_size],
                ids=all_ids[b:b + batch_size],
            )

    retriever.mark_dirty()

    return {
        "document_id": document_id,
        "filename": filename,
        "chunks_created": len(all_chunks),
    }


# Backwards compatibility alias
ingest_pdf = ingest_document


def list_documents() -> list[dict]:
    """Return distinct list of indexed documents with chunk counts and types."""
    results = collection.get(include=["metadatas"])
    metadatas = results.get("metadatas") or []

    docs = {}
    for meta in metadatas:
        doc_id = meta.get("document_id")
        if not doc_id:
            continue
        if doc_id not in docs:
            fname = meta.get("filename", "unknown_file")
            ext = Path(fname).suffix.lower().replace(".", "") or "txt"
            docs[doc_id] = {
                "document_id": doc_id,
                "filename": fname,
                "file_type": ext,
                "chunks_count": 0,
            }
        docs[doc_id]["chunks_count"] += 1

    return list(docs.values())


def retrieve(
    query: str, document_id: str | None = None, top_k: int = 5
) -> list[dict]:
    """Retrieve the top matching chunks using Enterprise Hybrid Search (Dense + BM25)."""
    return retriever.retrieve(query=query, document_id=document_id, top_k=top_k)


def get_document_file(document_id: str) -> tuple[Path, str] | None:
    """Find and return the stored file path and filename for a document_id."""
    for p in DOCUMENTS_DIR.glob(f"{document_id}_*"):
        filename = p.name.split("_", 1)[1] if "_" in p.name else p.name
        return p, filename
    return None


def get_document_page_text(document_id: str, page: int) -> dict:
    """Retrieve all chunks belonging to a specific page or section."""
    all_data = collection.get(include=["documents", "metadatas"])
    docs = all_data.get("documents") or []
    metas = all_data.get("metadatas") or []

    page_chunks = []
    filename = ""

    for text, meta in zip(docs, metas):
        if meta.get("document_id") == document_id:
            if not filename:
                filename = meta.get("filename", "")
            if int(meta.get("page", 1)) == page:
                page_chunks.append(text)

    return {
        "document_id": document_id,
        "page": page,
        "filename": filename,
        "content": "\n\n".join(page_chunks),
        "chunks_count": len(page_chunks),
    }


def delete_document(document_id: str) -> bool:
    """Delete a document from ChromaDB and local storage."""
    try:
        collection.delete(where={"document_id": document_id})
    except Exception as e:
        print(f"Error deleting from Chroma: {e}")

    for p in DOCUMENTS_DIR.glob(f"{document_id}_*"):
        try:
            p.unlink(missing_ok=True)
        except Exception:
            pass

    retriever.mark_dirty()
    return True

