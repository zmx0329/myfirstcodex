from __future__ import annotations

import base64
from io import BytesIO

import httpx
from PIL import Image

from ..config import Settings
from ..models.image_gen import ImageGenRequest, ImageGenResponse
from .errors import ImageGenerationError
from .utils import decode_base64_image


class ImageGenerationService:
  """Generates pixel-style images; uses remote model if配置，否则本地像素化兜底."""

  def __init__(self, settings: Settings):
    self.settings = settings

  async def generate(self, payload: ImageGenRequest) -> ImageGenResponse:
    image_bytes = decode_base64_image(payload.image_base64)

    if self.settings.image_gen_endpoint and self.settings.image_gen_key:
      try:
        generated = await self._call_remote_model(image_bytes, payload)
        return ImageGenResponse(image_base64=generated)
      except ImageGenerationError:
        # fall back to local pixelation
        pass

    fallback = self._pixelate_local(image_bytes, payload.block_size)
    return ImageGenResponse(image_base64=fallback)

  async def _call_remote_model(self, image_bytes: bytes, payload: ImageGenRequest) -> str:
    endpoint = self.settings.image_gen_endpoint
    api_key = self.settings.image_gen_key
    model = self.settings.image_gen_model or "gemini-3-pro-image-preview"
    headers = {"Content-Type": "application/json"}

    # Gemini-style payload; adjust as needed for actual endpoint shape
    body = {
      "contents": [
        {
          "parts": [
            {
              "inline_data": {
                "mime_type": "image/png",
                "data": base64.b64encode(image_bytes).decode("utf-8"),
              }
            },
            {"text": payload.prompt or "Convert this photo into a Stardew Valley pixel art style."},
          ]
        }
      ],
      "model": model,
    }

    params = {"key": api_key}
    try:
      async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(endpoint, headers=headers, params=params, json=body)
      response.raise_for_status()
    except httpx.HTTPStatusError as exc:
      status = exc.response.status_code
      if status == 401:
        raise ImageGenerationError("unauthorized", "生图服务认证失败", status_code=401) from exc
      if status == 429:
        raise ImageGenerationError("rate_limited", "生图服务繁忙，请稍后重试", status_code=429) from exc
      raise ImageGenerationError("image_gen_error", "生图服务返回错误", status_code=status) from exc
    except httpx.TimeoutException as exc:
      raise ImageGenerationError("timeout", "生图服务超时", status_code=504) from exc
    except Exception as exc:  # pragma: no cover - defensive
      raise ImageGenerationError("image_gen_error", "生图调用失败") from exc

    data = response.json()
    # Best-effort extraction of base64 image; adjust if response shape differs
    if "image_base64" in data and isinstance(data["image_base64"], str):
      return data["image_base64"]

    candidates = data.get("candidates") or data.get("predictions") or []
    if candidates:
      first = candidates[0]
      parts = first.get("content", {}).get("parts") if isinstance(first, dict) else None
      if isinstance(parts, list):
        for part in parts:
          inline = part.get("inline_data") if isinstance(part, dict) else None
          if inline and isinstance(inline.get("data"), str):
            return f"data:{inline.get('mime_type', 'image/png')};base64,{inline['data']}"

    raise ImageGenerationError("invalid_response", "生图响应不可用", status_code=502)

  def _pixelate_local(self, image_bytes: bytes, block_size: int) -> str:
    try:
      image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:  # pragma: no cover - defensive
      raise ImageGenerationError("invalid_image", "无法读取图像") from exc

    block = max(2, min(block_size, 64))
    small_w = max(1, image.width // block)
    small_h = max(1, image.height // block)
    small = image.resize((small_w, small_h), resample=Image.NEAREST)
    pixelated = small.resize((image.width, image.height), resample=Image.NEAREST)

    buffer = BytesIO()
    pixelated.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")
