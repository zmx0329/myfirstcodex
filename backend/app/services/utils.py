import base64

from ..services.errors import ImageGenerationError


def decode_base64_image(data: str) -> bytes:
  """Decode a base64 string or data URL into raw bytes."""
  try:
    if "base64," in data:
      _, encoded = data.split("base64,", maxsplit=1)
    else:
      encoded = data
    return base64.b64decode(encoded)
  except Exception as exc:  # pragma: no cover - defensive
    raise ImageGenerationError("invalid_image", "无法解析图像内容") from exc


def clamp(value: float, min_value: float, max_value: float) -> float:
  return max(min_value, min(value, max_value))


def format_time_label(hour: int, minute: int) -> str:
  suffix = "上午" if hour < 12 else "下午"
  display_hour = 12 if hour % 12 == 0 else hour % 12
  return f"{suffix} {display_hour}:{minute:02d}"


def wrap_text(text: str, limit: int) -> list[str]:
  """Simple greedy wrap keeping words/characters together."""
  if len(text) <= limit:
    return [text]

  lines = []
  current = ""
  for char in text:
    if len(current) + 1 > limit:
      lines.append(current)
      current = ""
    current += char
  if current:
    lines.append(current)
  return lines
