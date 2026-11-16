import json
import os
from pathlib import Path
import httpx
from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.tools import TOOL_REGISTRY

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
FALLBACK_MODEL = "gemini-3.5-flash-lite"
VALID_MODELS = {
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-pro",
    "qwen/qwen3.8-27b",
    "meta-llama/llama-3.3-70b-instruct:free",
}

GROQ_MODELS = {
    "qwen/qwen3.8-27b",
}

OPENROUTER_MODELS = {
    "meta-llama/llama-3.3-70b-instruct:free",
}

if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Add it to backend/.env"
    )

client = genai.Client(api_key=API_KEY)


def get_models_hierarchy(requested_model: str | None = None) -> list[str]:
    """Resolve primary and fallback models based on client request and environment configuration."""
    if requested_model == "gemini-3.5-flash-lite":
        return ["gemini-3.5-flash-lite", "gemini-3.5-flash"]
    elif requested_model in {"gemini-2.5-pro", "gemini-3.1-pro-preview"}:
        return ["gemini-3.5-flash", "gemini-3.5-flash-lite"]
    elif requested_model == "gemini-3.5-flash":
        return ["gemini-3.5-flash", "gemini-3.5-flash-lite"]
    else:
        # Default to ultra-fast gemini-3.5-flash (1.4s response time)
        return ["gemini-3.5-flash", "gemini-3.5-flash-lite"]


def call_groq(prompt: str, model: str) -> str | None:
    """Call Groq API for fast execution of open-source models."""
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return None
    try:
        with httpx.Client(timeout=60.0) as http_client:
            resp = http_client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are JohnGPT, a helpful personal AI assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.6,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Groq API call error: {e}")
    return None


def call_groq_stream(prompt: str, model: str):
    """Stream response tokens from Groq API."""
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return
    try:
        with httpx.Client(timeout=90.0) as http_client:
            with http_client.stream(
                "POST",
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are JohnGPT, a helpful personal AI assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": True,
                    "temperature": 0.6,
                },
            ) as resp:
                if resp.status_code != 200:
                    return
                for line in resp.iter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if delta:
                                yield delta
                        except Exception:
                            continue
    except Exception as e:
        print(f"Groq stream error: {e}")


def call_openrouter(prompt: str, model: str) -> str | None:
    """Call OpenRouter API for free models like Llama 3.3 (70B)."""
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        return None
    try:
        with httpx.Client(timeout=60.0) as http_client:
            resp = http_client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {key}",
                    "HTTP-Referer": "https://johngpt.vercel.app",
                    "X-Title": "JohnGPT",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are JohnGPT, a helpful personal AI assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.6,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                print(f"OpenRouter returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"OpenRouter API call error: {e}")
    return None


def call_openrouter_stream(prompt: str, model: str):
    """Stream response tokens from OpenRouter API."""
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        return
    try:
        with httpx.Client(timeout=90.0) as http_client:
            with http_client.stream(
                "POST",
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {key}",
                    "HTTP-Referer": "https://johngpt.vercel.app",
                    "X-Title": "JohnGPT",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are JohnGPT, a helpful personal AI assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": True,
                    "temperature": 0.6,
                },
            ) as resp:
                if resp.status_code != 200:
                    return
                for line in resp.iter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if delta:
                                yield delta
                        except Exception:
                            continue
    except Exception as e:
        print(f"OpenRouter stream error: {e}")


def call_gemini(contents, config=None, model=None):
    """Generate content with automatic fallback if primary model is busy or drops connection."""
    models_to_try = get_models_hierarchy(model)
    last_error = None
    for model_name in models_to_try:
        for _ in range(2):
            try:
                return client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
            except Exception as error:
                last_error = error
                error_msg = str(error).lower()
                is_recoverable = any(
                    k in error_msg
                    for k in (
                        "429",
                        "resource_exhausted",
                        "quota",
                        "rate_limit",
                        "rate limit",
                        "limit",
                        "exhausted",
                        "503",
                        "unavailable",
                        "404",
                        "not found",
                        "not_found",
                        "wsarecv",
                        "forcibly closed",
                        "stream reading error",
                        "timeout",
                        "reset by peer",
                        "10053",
                        "aborted",
                        "readerror",
                        "connection",
                    )
                )
                if is_recoverable:
                    import time
                    time.sleep(0.5)
                    continue
                break
    if last_error:
        raise last_error


def call_gemini_stream(contents, config=None, model=None):
    """
    Generate content stream with resilient retry and automatic fallback.
    Catches transient socket drops (wsarecv, stream reading error, UNAVAILABLE, 503)
    and switches to the fallback model smoothly.
    """
    models_to_try = get_models_hierarchy(model)
    last_error = None

    for model_name in models_to_try:
        for attempt in range(2):
            try:
                stream = client.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                yielded = False
                for chunk in stream:
                    yielded = True
                    yield chunk
                return
            except Exception as error:
                last_error = error
                error_msg = str(error).lower()
                print(f"[Stream Warning] Model {model_name} attempt {attempt+1} encountered: {error}")
                # If chunks were already yielded mid-flight, don't restart to avoid corrupted token order
                if yielded:
                    raise error

                # Check for transient network/socket, quota or load errors
                is_recoverable = any(
                    k in error_msg
                    for k in (
                        "429",
                        "resource_exhausted",
                        "quota",
                        "rate_limit",
                        "rate limit",
                        "limit",
                        "exhausted",
                        "wsarecv",
                        "forcibly closed",
                        "connection",
                        "remote host",
                        "stream reading error",
                        "503",
                        "unavailable",
                        "404",
                        "not found",
                        "not_found",
                        "timeout",
                        "reset by peer",
                    )
                )
                if not is_recoverable and attempt >= 1:
                    break
                import time
                time.sleep(0.5)

    if last_error:
        raise last_error


# Approved tools declared to Gemini.
TOOL_DECLARATIONS = [
    types.FunctionDeclaration(
        name="calculate",
        description=(
            "Calculate a basic arithmetic expression such as "
            "25 * 4, 100 / 5, or (10 + 5) * 2."
        ),
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "expression": types.Schema(
                    type=types.Type.STRING,
                    description="The arithmetic expression to calculate.",
                )
            },
            required=["expression"],
        ),
    ),
    types.FunctionDeclaration(
        name="get_current_datetime",
        description=(
            "Get the current date, time, weekday, and timezone. "
            "Can retrieve local time or time in a specific timezone."
        ),
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "timezone": types.Schema(
                    type=types.Type.STRING,
                    description=(
                        "Optional timezone name or abbreviation, such as "
                        "'UTC', 'Asia/Kolkata', 'America/New_York', 'PST', 'EST', 'JST'. "
                        "Leave empty for local time."
                    ),
                )
            },
        ),
    ),
    types.FunctionDeclaration(
        name="get_weather",
        description=(
            "Get the live weather, temperature, humidity, and conditions "
            "for any city or location in the world."
        ),
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "location": types.Schema(
                    type=types.Type.STRING,
                    description="The name of the city, region, or country (e.g. 'London', 'Tokyo', 'Mumbai', 'San Francisco').",
                )
            },
            required=["location"],
        ),
    ),
    types.FunctionDeclaration(
        name="web_search",
        description=(
            "Search the web for up-to-date facts, news, recent events, "
            "people, documentation, and external information."
        ),
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "query": types.Schema(
                    type=types.Type.STRING,
                    description="The search query terms.",
                )
            },
            required=["query"],
        ),
    ),
]


def rewrite_query(message: str, history_text: str = "") -> str:
    """Rewrite follow-up questions into standalone search queries."""

    if not history_text.strip():
        return message

    try:
        response = call_gemini(
            contents=f"""
Rewrite the latest user question as one standalone search query.

Use conversation history only to resolve references.
Do not answer the question.
Return only the rewritten query.

Conversation history:
{history_text}

Latest question:
{message}
""",
        )

        rewritten = (response.text or "").strip()

        if rewritten and len(rewritten) <= 1000:
            return rewritten

    except Exception as error:
        print(f"Query rewriting failed: {type(error).__name__}")

    return message


def generate_session_title(first_message: str) -> str:
    """Generate a clean, punchy 3-5 word title for a conversation using Gemini."""
    clean_msg = first_message.strip()
    if clean_msg.startswith("[Image Attached]"):
        clean_msg = clean_msg.replace("[Image Attached]", "").strip()

    if not clean_msg:
        return "Image Analysis"

    try:
        prompt = (
            "You are a helpful assistant. Generate a concise, natural 3 to 5 word title "
            "summarizing the topic of this user's query. "
            "Do NOT use quotation marks, punctuation, colons, or generic labels like 'Question' or 'Chat'. "
            "Output ONLY the plain text title.\n\n"
            f"User query: {clean_msg[:300]}"
        )
        response = call_gemini(
            contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=15,
            ),
        )
        title = (response.text or "").strip().strip('"').strip("'").strip(".").strip()
        if title and 2 <= len(title) <= 50:
            return title
    except Exception as error:
        print(f"Auto-titling failed: {error}")

    words = clean_msg.split()
    return " ".join(words[:4]).title() if words else "New Conversation"


def user_requested_sources(message: str) -> bool:
    """Return True if the user explicitly requested document sources, citations, references, or proof."""
    lowered = message.lower().strip()
    triggers = [
        "source",
        "sources",
        "cite",
        "citation",
        "citations",
        "reference",
        "references",
        "refer to",
        "where did you get",
        "where did you find",
        "where is this from",
        "which document",
        "which file",
        "which page",
        "what document",
        "what file",
        "what page",
        "proof",
        "show where",
        "show me where",
        "where in the document",
        "from which document",
    ]
    return any(trigger in lowered for trigger in triggers)


def run_agent(
    message: str,
    history_text: str = "",
    rag_context: str = "",
    image_bytes: bytes | None = None,
    image_mime_type: str | None = None,
    show_sources: bool | None = None,
    custom_instructions: str | None = None,
    model: str | None = None,
) -> dict:
    """Run Gemini with an allowlisted, multi-tool calling loop and multimodal vision."""

    if show_sources is None:
        show_sources = user_requested_sources(message)

    if show_sources:
        source_rule = "- The user has explicitly requested the source/citation. Cite the document filename and page number from the retrieved passages for your answer (e.g. '[Source: filename, Page X]')."
    else:
        source_rule = (
            "- Treat retrieved document passages as your own internal knowledge. Answer naturally, smoothly, and directly.\n"
            "- STRICT RULE: Do NOT include, mention, or display any source citations, document filenames, page numbers, or brackets like '[Source: ...]' or '(source: ...)' anywhere in your response unless the user explicitly asks for them."
        )

    custom_block = (
        f"\nUser's Custom Preferences & Instructions:\n{custom_instructions.strip()}\n"
        if custom_instructions and custom_instructions.strip()
        else ""
    )

    prompt = f"""
You are JohnGPT, a helpful personal AI assistant.
{custom_block}
Conversation history:
{history_text or "No previous conversation."}

Retrieved document passages:
{rag_context or "No document passages supplied."}

Latest user message:
{message}

Instructions:
- Answer ordinary questions naturally, warmly, and concisely.
- When an image is attached, inspect its visual contents, diagrams, charts, UI screenshots, or text thoroughly.
- Use `calculate` for arithmetic calculations.
- Use `get_current_datetime` when asked about current date, time, weekday, or timezone.
- Use `get_weather` when asked about current weather or temperature in any location.
- Never claim that a tool ran unless it actually ran.
{source_rule}
- When asked to create, design, or show a presentation, PowerPoint (PPT/PPTX), pitch deck, or slides artifact (or when shown a slides screenshot):
  * You have native, first-class support for interactive slide presentations (JohnGPT Slides), featuring a 16:9 editorial canvas, bottom filmstrip carousel with numbered thumbnail preview cards, fullscreen presentation mode, and one-click export to real Microsoft PowerPoint (.pptx) files!
  * Enthusiastically introduce the deck and summarize its slide structure.
  * Provide the complete deck definition inside a ```slides code block with valid JSON containing:
      - "title": presentation title string
      - "theme": "forest" (or "cream", "gold", "obsidian", "indigo")
      - "slides": array of 4-8 slide objects. Each slide object MUST have:
          * "id": unique string (e.g. "slide-1")
          * "layout": "title" | "stats" | "bullets" | "columns" | "table" | "quote"
          * "kicker": short uppercase category tag
          * "title": slide headline
          * "subtitle": brief subtitle or summary
          * "themeVariant": optional theme override ("forest", "cream", "gold")
          * layout-specific data:
              for stats: "stats" list of objects having "value", "label", "desc"
              for bullets: "points" list of objects having "title", "text"
              for columns: "columns" list of objects having "title", "role", "desc"
              for table: "table" object having "headers" list and "rows" 2D list
              for quote: "quote" text string and "author" name string
  * This code block is automatically recognized by JohnGPT and rendered as an interactive Slides Artifact with live filmstrip navigation and instant PowerPoint download.
- When asked to write, draft, or create technical documentation, design specifications, PRDs, research reports, or guides:
  * Provide the complete, structured document inside a ```doc code block so JohnGPT renders it as an interactive Document Artifact with table of contents outline, word count, reading time, and Markdown/PDF export.
- When asked to build an interactive dashboard, UI component, mockup, calculator, or web app:
  * Provide complete, self-contained, and interactive HTML, CSS, and JavaScript in a single ```html code block so it renders immediately in the interactive App Sandbox workspace.
- When asked for code, programming, data science/ML models, algorithms, or technical solutions (e.g., in Python, JavaScript, TypeScript, SQL, etc.):
  * Immediately provide clean, modular, performant, and production-ready code with type hints, numerical stability considerations, and best practices.
  * Include clear explanations, architecture rationale, and runnable example usage.
- When asked to create, code, or build an interactive playable game, interactive web app, or frontend showcase:
  * If the request is generic or lacks details (such as just "create a game", "build an app", or "make a website" without specifying the genre, gameplay, theme, or rules), do NOT generate code immediately. Instead, enthusiastically ask 2-3 quick questions or propose 3-4 distinct options (e.g., 2D Car Racing, Retro Space Shooter, Cyberpunk Snake, or Platformer) to clarify what they want to build.
  * Once specific details, a game genre, or mechanics are provided (e.g., "car racing game with arrow keys"), provide complete, standalone, production-ready code with embedded HTML, CSS, and JavaScript in a single ```html code block so it runs directly inside the Studio workspace.
- Never invent tool results or sources.
"""

    prefix = ""
    if model in GROQ_MODELS:
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            groq_ans = call_groq(prompt, model)
            if groq_ans:
                return {"answer": groq_ans, "tool_used": None}
        friendly_name = {
            "qwen/qwen3.8-27b": "Qwen 3.8 (27B)",
        }.get(model, model)
        prefix = f"> 💡 **Notice:** You selected **{friendly_name}**. To run via Groq, add `GROQ_API_KEY` to `backend/.env` (Free at [console.groq.com](https://console.groq.com)). Fulfilling via **Gemini 3.5 Flash**:\n\n"
        model = "gemini-3.5-flash"
    elif model in OPENROUTER_MODELS:
        or_key = os.getenv("OPENROUTER_API_KEY")
        if or_key:
            or_ans = call_openrouter(prompt, model)
            if or_ans:
                return {"answer": or_ans, "tool_used": None}
        friendly_name = {
            "meta-llama/llama-3.3-70b-instruct:free": "Llama 3.3 (70B)",
        }.get(model, "OpenRouter Model")
        prefix = f"> 💡 **Notice:** You selected **{friendly_name}**. To run directly via OpenRouter, add `OPENROUTER_API_KEY` to `backend/.env` (Free at [openrouter.ai](https://openrouter.ai)). Fulfilling via **Gemini 3.5 Flash**:\n\n"
        model = "gemini-3.5-flash"

    user_parts = [types.Part.from_text(text=prompt)]
    if image_bytes:
        user_parts.append(
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=image_mime_type or "image/jpeg",
            )
        )

    contents = [
        types.Content(
            role="user",
            parts=user_parts,
        )
    ]

    tool_used = None
    max_rounds = 4

    for _ in range(max_rounds):
        response = call_gemini(
            contents=contents,
            config=types.GenerateContentConfig(
                tools=[
                    types.Tool(
                        function_declarations=TOOL_DECLARATIONS
                    )
                ],
            ),
            model=model,
        )

        if not response.candidates:
            raise RuntimeError("Gemini returned no candidates.")

        model_content = response.candidates[0].content
        contents.append(model_content)

        function_calls = [
            part.function_call
            for part in (model_content.parts or [])
            if getattr(part, "function_call", None) is not None
        ]

        # No tool call means Gemini has produced its final answer.
        if not function_calls:
            answer = (response.text or "").strip()

            if not answer:
                answer = "I couldn't generate a response. Please try again."

            return {
                "answer": prefix + answer,
                "tool_used": tool_used,
            }

        # Execute only registered tools through the allowlist.
        for call in function_calls:
            name = call.name

            if name not in TOOL_REGISTRY:
                result = {"error": f"Tool '{name}' is not permitted."}
            else:
                try:
                    args = dict(call.args or {})
                    value = TOOL_REGISTRY[name](**args)
                    result = {"result": value}
                    tool_used = name
                except Exception as error:
                    result = {"error": str(error)}

            # Send the tool result back to Gemini.
            contents.append(
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_function_response(
                            name=name,
                            response=result,
                        )
                    ],
                )
            )

    return {
        "answer": (
            "I reached the tool-call limit before completing "
            "your request. Please try again."
        ),
        "tool_used": tool_used,
    }


def run_agent_stream(
    message: str,
    history_text: str = "",
    rag_context: str = "",
    image_bytes: bytes | None = None,
    image_mime_type: str | None = None,
    show_sources: bool | None = None,
    custom_instructions: str | None = None,
    model: str | None = None,
):
    """
    Stream Gemini response tokens and tool execution events in real time.
    Yields dictionary events:
      - {"type": "tool_start", "tool": name}
      - {"type": "tool_done", "tool": name}
      - {"type": "token", "text": text}
      - {"type": "done", "answer": full_text, "tool_used": tool_used}
    """
    if show_sources is None:
        show_sources = user_requested_sources(message)

    if show_sources:
        source_rule = "- The user has explicitly requested the source/citation. Cite the document filename and page number from the retrieved passages for your answer (e.g. '[Source: filename, Page X]')."
    else:
        source_rule = (
            "- Treat retrieved document passages as your own internal knowledge. Answer naturally, smoothly, and directly.\n"
            "- STRICT RULE: Do NOT include, mention, or display any source citations, document filenames, page numbers, or brackets like '[Source: ...]' or '(source: ...)' anywhere in your response unless the user explicitly asks for them."
        )

    custom_block = (
        f"\nUser's Custom Preferences & Instructions:\n{custom_instructions.strip()}\n"
        if custom_instructions and custom_instructions.strip()
        else ""
    )

    prompt = f"""
You are JohnGPT, a helpful personal AI assistant.
{custom_block}
Conversation history:
{history_text or "No previous conversation."}

Retrieved document passages:
{rag_context or "No document passages supplied."}

Latest user message:
{message}

Instructions:
- Answer ordinary questions naturally, warmly, and concisely.
- When an image is attached, inspect its visual contents, diagrams, charts, UI screenshots, or text thoroughly.
- Use `calculate` for arithmetic calculations.
- Use `get_current_datetime` when asked about current date, time, weekday, or timezone.
- Use `get_weather` when asked about current weather or temperature in any location.
- Use `web_search` when asked for current news, recent events, facts, or external information.
- Never claim that a tool ran unless it actually ran.
{source_rule}
- When presenting mathematical formulas or calculations, format equations cleanly using standard markdown (e.g., 1/2 or a/b) or standard LaTeX enclosed in single dollar signs ($...$) for inline math and double dollar signs ($$...$$) for block math. Never output raw LaTeX commands like \frac outside of math delimiters.
- For currency, money, and prices (e.g., $80, $20, $60), write them normally in plain text as $80 or $20. NEVER wrap money amounts in LaTeX math delimiters ($...$ or $$...$$), and NEVER write $\\$80$ or \\$80.
- For collapsible answer keys, spoiler solutions, or hidden explanations, use standard HTML <details><summary><b>Click to reveal the Answer Key & Explanations</b></summary>\n\n[Answers here]\n\n</details>. Always ensure there are clear line breaks after <summary> and before </details>.
- When asked to create, design, or show a presentation, PowerPoint (PPT/PPTX), pitch deck, or slides artifact (or when shown a slides screenshot):
  * You have native, first-class support for interactive slide presentations (JohnGPT Slides), featuring a 16:9 editorial canvas, bottom filmstrip carousel with numbered thumbnail preview cards, fullscreen presentation mode, and one-click export to real Microsoft PowerPoint (.pptx) files!
  * Enthusiastically introduce the deck and summarize its slide structure.
  * Provide the complete deck definition inside a ```slides code block with valid JSON containing:
      - "title": presentation title string
      - "theme": "forest" (or "cream", "gold", "obsidian", "indigo")
      - "slides": array of 4-8 slide objects. Each slide object MUST have:
          * "id": unique string (e.g. "slide-1")
          * "layout": "title" | "stats" | "bullets" | "columns" | "table" | "quote"
          * "kicker": short uppercase category tag
          * "title": slide headline
          * "subtitle": brief subtitle or summary
          * "themeVariant": optional theme override ("forest", "cream", "gold")
          * layout-specific data:
              for stats: "stats" list of objects having "value", "label", "desc"
              for bullets: "points" list of objects having "title", "text"
              for columns: "columns" list of objects having "title", "role", "desc"
              for table: "table" object having "headers" list and "rows" 2D list
              for quote: "quote" text string and "author" name string
  * This code block is automatically recognized by JohnGPT and rendered as an interactive Slides Artifact with live filmstrip navigation and instant PowerPoint download.
- When asked to write, draft, or create technical documentation, design specifications, PRDs, research reports, or guides:
  * Provide the complete, structured document inside a ```doc code block so JohnGPT renders it as an interactive Document Artifact with table of contents outline, word count, reading time, and Markdown/PDF export.
- When asked to build an interactive dashboard, UI component, mockup, calculator, or web app:
  * Provide complete, self-contained, and interactive HTML, CSS, and JavaScript in a single ```html code block so it renders immediately in the interactive App Sandbox workspace.
- When asked for code, programming, data science/ML models, algorithms, or technical solutions (e.g., in Python, JavaScript, TypeScript, SQL, etc.):
  * Immediately provide clean, modular, performant, and production-ready code with type hints, numerical stability considerations, and best practices.
  * Include clear explanations, architecture rationale, and runnable example usage.
- When asked to create, code, or build an interactive playable game, interactive web app, or frontend showcase:
  * If the request is generic or lacks details (such as just "create a game", "build an app", or "make a website" without specifying the genre, gameplay, theme, or rules), do NOT generate code immediately. Instead, enthusiastically ask 2-3 quick questions or propose 3-4 distinct options (e.g., 2D Car Racing, Retro Space Shooter, Cyberpunk Snake, or Platformer) to clarify what they want to build.
  * Once specific details, a game genre, or mechanics are provided (e.g., "car racing game with arrow keys"), provide complete, standalone, production-ready code with embedded HTML, CSS, and JavaScript in a single ```html code block so it runs directly inside the Studio workspace.
- Never invent tool results or sources.
"""

    if model in GROQ_MODELS:
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            groq_text = ""
            streamed = False
            for chunk in call_groq_stream(prompt, model):
                streamed = True
                groq_text += chunk
                yield {"type": "token", "text": chunk}
            if streamed:
                yield {
                    "type": "done",
                    "answer": groq_text.strip(),
                    "tool_used": None,
                }
                return

        friendly_name = {
            "qwen/qwen3.8-27b": "Qwen 3.8 (27B)",
        }.get(model, model)
        prefix = f"> 💡 **Notice:** You selected **{friendly_name}**. To stream directly from Groq, add `GROQ_API_KEY` to `backend/.env` (Free at [console.groq.com](https://console.groq.com)).\n> \n> Fulfilling your request below via **Gemini 3.5 Flash**:\n\n"
        yield {"type": "token", "text": prefix}
        model = "gemini-3.5-flash"

    elif model in OPENROUTER_MODELS:
        or_key = os.getenv("OPENROUTER_API_KEY")
        if or_key:
            or_text = ""
            streamed = False
            for chunk in call_openrouter_stream(prompt, model):
                streamed = True
                or_text += chunk
                yield {"type": "token", "text": chunk}
            if streamed:
                yield {
                    "type": "done",
                    "answer": or_text.strip(),
                    "tool_used": None,
                }
                return

        friendly_name = {
            "meta-llama/llama-3.3-70b-instruct:free": "Llama 3.3 (70B)",
        }.get(model, "OpenRouter Model")
        prefix = f"> 💡 **Notice:** You selected **{friendly_name}**. To stream directly from OpenRouter, add `OPENROUTER_API_KEY` to `backend/.env` (Free at [openrouter.ai](https://openrouter.ai)).\n> \n> Fulfilling your request below via **Gemini 3.5 Flash**:\n\n"
        yield {"type": "token", "text": prefix}
        model = "gemini-3.5-flash"

    user_parts = [types.Part.from_text(text=prompt)]
    if image_bytes:
        user_parts.append(
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=image_mime_type or "image/jpeg",
            )
        )

    contents = [
        types.Content(
            role="user",
            parts=user_parts,
        )
    ]

    tool_used = None
    max_rounds = 4

    try:
        for _ in range(max_rounds):
            stream = call_gemini_stream(
                contents=contents,
                config=types.GenerateContentConfig(
                    tools=[
                        types.Tool(
                            function_declarations=TOOL_DECLARATIONS
                        )
                    ],
                ),
                model=model,
            )

            has_tool_call = False
            full_text = ""

            for chunk in stream:
                if not chunk.candidates:
                    continue
                cand = chunk.candidates[0]
                if not cand.content or not cand.content.parts:
                    finish_reason = getattr(cand, "finish_reason", None)
                    if finish_reason and any(k in str(finish_reason).upper() for k in ("SAFETY", "BLOCK", "PROHIBITED")):
                        msg = "I am unable to generate content on this specific topic due to safety guidelines. Please try rephrasing your prompt."
                        full_text += msg
                        yield {"type": "token", "text": msg}
                    continue

                parts = cand.content.parts
                for part in parts:
                    if part.function_call:
                        has_tool_call = True
                        name = part.function_call.name
                        yield {"type": "tool_start", "tool": name}

                        if name not in TOOL_REGISTRY:
                            result = {"error": f"Tool '{name}' is not permitted."}
                        else:
                            try:
                                args = dict(part.function_call.args or {})
                                value = TOOL_REGISTRY[name](**args)
                                result = {"result": value}
                                tool_used = name
                            except Exception as error:
                                result = {"error": str(error)}

                        yield {"type": "tool_done", "tool": name}

                        # Append function call and response for next round
                        contents.append(chunk.candidates[0].content)
                        contents.append(
                            types.Content(
                                role="user",
                                parts=[
                                    types.Part.from_function_response(
                                        name=name,
                                        response=result,
                                    )
                                ],
                            )
                        )
                        break
                    elif part.text:
                        full_text += part.text
                        yield {"type": "token", "text": part.text}

                if has_tool_call:
                    break

            if not has_tool_call:
                yield {"type": "done", "answer": full_text.strip(), "tool_used": tool_used}
                return

        yield {
            "type": "done",
            "answer": "I reached the tool-call limit before completing your request. Please try again.",
            "tool_used": tool_used,
        }
    except Exception as gemini_err:
        # Ultimate fallback: If Google API is saturated, stream via Groq Qwen
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key and not tool_used:
            print(f"[Streaming Fallback] Gemini failed with {gemini_err}. Seamlessly falling back to Groq Qwen...")
            groq_text = ""
            for chunk in call_groq_stream(prompt, "qwen/qwen3.8-27b"):
                groq_text += chunk
                yield {"type": "token", "text": chunk}
            if groq_text:
                yield {
                    "type": "done",
                    "answer": groq_text.strip(),
                    "tool_used": None,
                }
                return
        raise gemini_err

