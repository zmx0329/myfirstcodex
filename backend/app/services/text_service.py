from __future__ import annotations

from ..clients.text_client import LLMTextClient
from ..config import Settings
from ..models.text import TextRequest, TextResponse
from .errors import TextGenerationError


class TextService:
  """Generates Stardew-toned descriptions with LLM + safe fallback."""

  def __init__(self, settings: Settings):
    self.settings = settings
    self.client = (
      LLMTextClient(settings.text_gen_endpoint, settings.text_gen_key)
      if settings.text_gen_endpoint and settings.text_gen_key
      else None
    )

  async def generate_description(self, request: TextRequest) -> TextResponse:
    object_name = request.object_name or "这件物品"
    category = request.category or "杂物"
    context = request.context

    if self.client:
      try:
        text = await self.client.generate_description(object_name, category, context)
        return TextResponse(description=self._trim_to_two_sentences(text))
      except TextGenerationError:
        # Fallback to template on any upstream failure (429/timeout/invalid response)
        pass

    return TextResponse(description=self._template_description(object_name, category, context))

  def _template_description(self, object_name: str, category: str, context: str | None) -> str:
    hint = "像是从谷仓里翻出的旧物" if category in ("杂物", "家具") else "带着刚晒过的暖意"
    context_note = f" 关于{context}" if context else ""
    return f"{object_name}散发着{hint}，{context_note}让人想起星露谷的慢生活。轻轻触碰，仿佛能听到远处风铃声。"

  def _trim_to_two_sentences(self, text: str) -> str:
    """Ensure the result stays short (<=2 sentences)."""
    normalized = text.strip().replace("\n", " ")
    parts = [part.strip() for part in normalized.split("。") if part.strip()]
    if not parts:
      return self._template_description("这件物品", "杂物", None)
    first_two = "。".join(parts[:2])
    if not first_two.endswith("。"):
      first_two += "。"
    return first_two
