import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.tools import TOOL_REGISTRY

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
FALLBACK_MODEL = "gemini-3.5-flash" if "lite" in MODEL else "gemini-3.5-flash-lite"
VALID_MODELS = {"gemini-3.5-flash-lite", "gemini-3.5-flash"}

if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Add it to backend/.env"
    )

client = genai.Client(api_key=API_KEY)


def get_models_hierarchy(requested_model: str | None = None) -> list[str]:
    """Resolve primary and fallback models based on client request and environment configuration."""
    primary = requested_model if requested_model in VALID_MODELS else MODEL
    fallback = "gemini-3.5-flash" if "lite" in primary else "gemini-3.5-flash-lite"
    return [primary, fallback]


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
                        "503",
                        "unavailable",
                        "404",
                        "wsarecv",
                        "forcibly closed",
                        "stream reading error",
                        "timeout",
                        "reset by peer",
                    )
                )
                if is_recoverable:
                    import time
                    time.sleep(0.5)
                    continue
                raise
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

                # Check for transient network/socket or load errors
                is_recoverable = any(
                    k in error_msg
                    for k in (
                        "wsarecv",
                        "forcibly closed",
                        "connection",
                        "remote host",
                        "stream reading error",
                        "503",
                        "unavailable",
                        "404",
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
- When asked to create, code, or build interactive web apps, games, tools, calculators, dashboards, or diagrams, provide complete, standalone, production-ready code with embedded HTML, CSS, and JavaScript in a single ```html code block so it runs directly inside the Studio workspace.
- Never invent tool results or sources.
"""

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
                "answer": answer,
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
- When asked to create, code, or build interactive web apps, games, tools, calculators, dashboards, or diagrams, provide complete, standalone, production-ready code with embedded HTML, CSS, and JavaScript in a single ```html code block so it runs directly inside the Studio workspace.
- Never invent tool results or sources.
"""

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
            parts = chunk.candidates[0].content.parts if chunk.candidates else []
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

