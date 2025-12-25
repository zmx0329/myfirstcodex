from __future__ import annotations

import httpx

from ..services.errors import TextGenerationError


class LLMTextClient:
  """Generic LLM text generation client."""

  def __init__(self, endpoint: str, api_key: str):
    self.endpoint = endpoint
    self.api_key = api_key

  async def generate_description(self, object_name: str, category: str, context: str | None = None) -> str:
    if not self.endpoint or not self.api_key:
      raise TextGenerationError("llm_config", "未配置文案服务", status_code=500)

    payload = {
      "object_name": object_name,
      "category": category,
      "context": context,
      "tone": "stardew",
    }
    headers = {"Authorization": f"Bearer {self.api_key}"}

    async with httpx.AsyncClient(timeout=12.0) as client:
      try:
        response = await client.post(self.endpoint, json=payload, headers=headers)
        response.raise_for_status()
      except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status == 401:
          raise TextGenerationError("unauthorized", "文案服务认证失败", status_code=401) from exc
        if status == 429:
          raise TextGenerationError("rate_limited", "文案服务繁忙，请稍后再试", status_code=429) from exc
        raise TextGenerationError("llm_error", "文案服务返回错误", status_code=status) from exc
      except httpx.TimeoutException as exc:
        raise TextGenerationError("timeout", "文案生成超时", status_code=504) from exc

    data = response.json()
    # Support a few common schema shapes to stay flexible.
    if "description" in data and isinstance(data["description"], str):
      return data["description"].strip()
    if "text" in data and isinstance(data["text"], str):
      return data["text"].strip()
    choices = data.get("choices")
    if choices and isinstance(choices, list):
      first = choices[0]
      if isinstance(first, dict):
        message = first.get("message", {}) if isinstance(first.get("message"), dict) else {}
        content = message.get("content")
        if isinstance(content, str):
          return content.strip()

    raise TextGenerationError("invalid_response", "文案服务响应不可用", status_code=502)
