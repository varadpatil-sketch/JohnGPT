import ast
import datetime
import html
import math
import operator
import re
from zoneinfo import ZoneInfo
import httpx

OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.USub: operator.neg,
}


def calculate(expression: str) -> float | int:
    """Safely evaluate a basic arithmetic expression."""
    if len(expression) > 200:
        raise ValueError("Expression is too long")

    tree = ast.parse(expression, mode="eval")
    nodes = list(ast.walk(tree))

    if len(nodes) > 50:
        raise ValueError("Expression is too complex")

    def evaluate(node):
        if isinstance(node, ast.Constant):
            if type(node.value) not in (int, float):
                raise ValueError("Only numbers are allowed")
            return node.value

        if isinstance(node, ast.UnaryOp):
            operation = OPERATORS.get(type(node.op))
            if operation is None:
                raise ValueError("Unsupported operation")
            return operation(evaluate(node.operand))

        if isinstance(node, ast.BinOp):
            operation = OPERATORS.get(type(node.op))
            if operation is None:
                raise ValueError("Unsupported operation")

            left = evaluate(node.left)
            right = evaluate(node.right)

            if abs(left) > 1e12 or abs(right) > 1e12:
                raise ValueError("Number too large")

            result = operation(left, right)

            if not math.isfinite(result) or abs(result) > 1e12:
                raise ValueError("Result is invalid or too large")

            return result

        raise ValueError("Unsupported expression")

    return evaluate(tree.body)


def get_current_datetime(timezone: str = "") -> dict:
    """Get the current date, time, weekday, and timezone."""
    tz = None
    tz_clean = timezone.strip() if timezone else ""

    if tz_clean:
        try:
            tz = ZoneInfo(tz_clean)
        except Exception:
            # Common timezone alias corrections
            aliases = {
                "ist": "Asia/Kolkata",
                "est": "America/New_York",
                "edt": "America/New_York",
                "cst": "America/Chicago",
                "cdt": "America/Chicago",
                "pst": "America/Los_Angeles",
                "pdt": "America/Los_Angeles",
                "utc": "UTC",
                "gmt": "UTC",
                "bst": "Europe/London",
                "cet": "Europe/Paris",
                "jst": "Asia/Tokyo",
            }
            alias_match = aliases.get(tz_clean.lower())
            if alias_match:
                try:
                    tz = ZoneInfo(alias_match)
                except Exception:
                    tz = None

    now = datetime.datetime.now(tz=tz) if tz else datetime.datetime.now().astimezone()

    return {
        "datetime": now.strftime("%Y-%m-%d %H:%M:%S"),
        "readable": now.strftime("%A, %B %d, %Y at %I:%M %p %Z"),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%I:%M %p"),
        "day_of_week": now.strftime("%A"),
        "timezone": str(now.tzinfo),
    }


WMO_WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def get_weather(location: str) -> dict:
    """Get live temperature and weather conditions for any location."""
    clean_loc = location.strip()
    if not clean_loc:
        raise ValueError("Location name cannot be empty")

    # 1. Geocoding lookup
    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={clean_loc}&count=1&language=en&format=json"
    geo_res = httpx.get(geo_url, timeout=8.0)
    if geo_res.status_code != 200:
        raise RuntimeError(f"Geocoding service unavailable (code {geo_res.status_code})")

    geo_data = geo_res.json()
    results = geo_data.get("results")
    if not results:
        return {"error": f"Could not find coordinates for location: '{clean_loc}'"}

    place = results[0]
    lat = place["latitude"]
    lon = place["longitude"]
    place_name = place.get("name", clean_loc)
    country = place.get("country", "")
    full_name = f"{place_name}, {country}" if country else place_name

    # 2. Forecast lookup
    weather_url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
    )
    weather_res = httpx.get(weather_url, timeout=8.0)
    if weather_res.status_code != 200:
        raise RuntimeError(f"Weather service unavailable (code {weather_res.status_code})")

    current = weather_res.json().get("current", {})
    temp_c = current.get("temperature_2m")
    temp_f = round(temp_c * 9 / 5 + 32, 1) if temp_c is not None else None
    feels_c = current.get("apparent_temperature")
    feels_f = round(feels_c * 9 / 5 + 32, 1) if feels_c is not None else None
    weather_code = current.get("weather_code")
    condition = WMO_WEATHER_CODES.get(weather_code, "Unknown condition")

    return {
        "location": full_name,
        "temperature_celsius": temp_c,
        "temperature_fahrenheit": temp_f,
        "feels_like_celsius": feels_c,
        "feels_like_fahrenheit": feels_f,
        "condition": condition,
        "humidity_percent": current.get("relative_humidity_2m"),
        "wind_speed_kmh": current.get("wind_speed_10m"),
    }


def web_search(query: str, max_results: int = 4) -> list[dict] | dict:
    """Search the web for up-to-date information, news, and facts."""
    clean_query = query.strip()
    if not clean_query:
        raise ValueError("Search query cannot be empty")

    url = "https://html.duckduckgo.com/html/"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
    }

    try:
        response = httpx.post(
            url,
            data={"q": clean_query},
            headers=headers,
            timeout=10.0,
            follow_redirects=True,
        )
        if response.status_code != 200:
            return {"error": f"Search returned status {response.status_code}"}

        titles_urls = re.findall(
            r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>',
            response.text,
            re.DOTALL,
        )
        snippets = re.findall(
            r'class="result__snippet[^>]*>(.*?)</a>',
            response.text,
            re.DOTALL,
        )

        results = []
        limit = min(max_results, len(titles_urls), len(snippets))
        for i in range(limit):
            raw_url, raw_title = titles_urls[i]
            title = html.unescape(re.sub(r"<[^>]+>", "", raw_title)).strip()
            snippet = html.unescape(re.sub(r"<[^>]+>", "", snippets[i])).strip()

            # Clean DDG redirect URL if needed
            clean_url = raw_url
            if "uddg=" in raw_url:
                import urllib.parse
                parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
                if "uddg" in parsed:
                    clean_url = parsed["uddg"][0]

            results.append({
                "title": title,
                "snippet": snippet,
                "url": clean_url,
            })

        if not results:
            return {"message": "No search results found for the query."}

        return results

    except Exception as error:
        return {"error": f"Web search failed: {error}"}


# Only functions in this registry can be called by the agent.
TOOL_REGISTRY = {
    "calculate": calculate,
    "get_current_datetime": get_current_datetime,
    "get_weather": get_weather,
    "web_search": web_search,
}