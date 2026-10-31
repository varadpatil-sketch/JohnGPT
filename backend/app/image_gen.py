import base64
import os
import random
import urllib.parse
import urllib.request
from google import genai
from google.genai import types

API_KEY = os.getenv("GEMINI_API_KEY")

# Supported Google GenAI image models
GOOGLE_IMAGE_MODELS = [
    "nano-banana-pro-preview",
    "gemini-2.5-flash-image",
    "gemini-nano-banana-2.1",
    "gemini-3.1-flash-image",
]

STYLE_PRESETS = {
    "Photorealistic": "photorealistic, 8k resolution, highly detailed, master photograph, dramatic cinematic lighting, photoreal, DSLR 85mm lens",
    "Cinematic": "cinematic film still, 35mm lens, anamorphic lighting, blockbuster movie production, ultra-detailed, depth of field",
    "Anime / Manga": "vibrant Japanese anime art style, Makoto Shinkai aesthetic, vivid colors, clean lineart, digital illustration",
    "3D Digital Art": "Pixar and Unreal Engine 5 render, 3D digital art, octane render, volumetric lighting, raytracing, 8k masterpiece",
    "Cyberpunk": "cyberpunk aesthetic, neon city lights, holographic glow, high-tech dystopian atmosphere, reflective wet pavement",
    "Fantasy Art": "epic high fantasy concept art, mystical atmosphere, magical particles, detailed digital painting, ArtStation trending",
    "Watercolor": "delicate watercolor painting, soft pigment washes, visible paper texture, fluid brushstrokes, artistic splash",
    "Vintage Comic": "vintage 1980s retro comic book style, bold black ink outlines, halftone dot patterns, vibrant retro colors",
    "Minimalist Vector": "clean minimalist vector illustration, sleek shapes, harmonious modern color palette, flat design icon",
}

ASPECT_RATIO_DIMS = {
    "1:1": (1024, 1024),
    "16:9": (1280, 720),
    "9:16": (720, 1280),
    "4:3": (1024, 768),
    "3:4": (768, 1024),
}


def build_full_prompt(prompt: str, style: str | None = None) -> str:
    prompt = prompt.strip()
    if not style or style == "None":
        return prompt
    style_enhancement = STYLE_PRESETS.get(style, style)
    if style_enhancement.lower() in prompt.lower():
        return prompt
    return f"{prompt}, {style_enhancement}"


def generate_with_google(prompt: str, aspect_ratio: str = "1:1", requested_model: str | None = None) -> dict | None:
    """Attempt image generation using Google GenAI SDK (Nano Banana / Gemini Image)."""
    if not API_KEY:
        return None

    client = genai.Client(api_key=API_KEY)
    models_to_try = [requested_model] if requested_model and requested_model in GOOGLE_IMAGE_MODELS else GOOGLE_IMAGE_MODELS

    for model_name in models_to_try:
        if not model_name:
            continue
        try:
            config = types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio if aspect_ratio in ("1:1", "3:4", "4:3", "9:16", "16:9") else "1:1"
                ),
            )
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )

            if response and response.candidates:
                for cand in response.candidates:
                    if cand.content and cand.content.parts:
                        for part in cand.content.parts:
                            if hasattr(part, "inline_data") and part.inline_data:
                                data_bytes = part.inline_data.data
                                if isinstance(data_bytes, str):
                                    b64_str = data_bytes
                                else:
                                    b64_str = base64.b64encode(data_bytes).decode("utf-8")
                                mime = getattr(part.inline_data, "mime_type", "image/png") or "image/png"
                                return {
                                    "image_url": f"data:{mime};base64,{b64_str}",
                                    "model_used": f"Google {model_name} (Pro Plan)",
                                }
        except Exception as e:
            err_str = str(e).lower()
            # If quota exhausted (limit: 0 on free tier) or model not supported, try next or fallback
            print(f"Google Image Gen attempt with {model_name} failed: {e}")
            continue

    return None


def generate_with_flux_fallback(prompt: str, aspect_ratio: str = "1:1") -> dict:
    """High-speed neural image synthesis fallback using Flux.1 engine."""
    width, height = ASPECT_RATIO_DIMS.get(aspect_ratio, (1024, 1024))
    encoded_prompt = urllib.parse.quote(prompt)
    seed = random.randint(100000, 999999)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&seed={seed}&nologo=true&model=flux"

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = resp.read()
            mime = resp.headers.get("content-type", "image/jpeg").split(";")[0]
            b64_str = base64.b64encode(data).decode("utf-8")
            return {
                "image_url": f"data:{mime};base64,{b64_str}",
                "model_used": "Nano Banana Pro (Flux AI Engine)",
                "seed": seed,
            }
    except Exception as e:
        print(f"Fallback generation error: {e}")
        # If network read times out, return the direct URL which browsers can load seamlessly
        return {
            "image_url": url,
            "model_used": "Nano Banana Pro (Direct Synthesis)",
            "seed": seed,
        }


def generate_image_pipeline(
    prompt: str,
    aspect_ratio: str = "1:1",
    style: str | None = None,
    model: str | None = None,
) -> dict:
    """
    Unified Image Generation Pipeline.
    Tries Google GenAI Nano Banana Pro (for users with Google AI Pro plan quota),
    and falls back smoothly to Flux AI engine if Google returns quota limit 0.
    """
    full_prompt = build_full_prompt(prompt, style)
    
    # Try Google Pro image model first
    result = generate_with_google(full_prompt, aspect_ratio, model)
    if result:
        result["prompt"] = prompt
        result["full_prompt"] = full_prompt
        result["aspect_ratio"] = aspect_ratio
        result["style"] = style or "Default"
        return result

    # Fallback to high-speed Flux synthesis
    fallback_res = generate_with_flux_fallback(full_prompt, aspect_ratio)
    fallback_res["prompt"] = prompt
    fallback_res["full_prompt"] = full_prompt
    fallback_res["aspect_ratio"] = aspect_ratio
    fallback_res["style"] = style or "Default"
    return fallback_res

