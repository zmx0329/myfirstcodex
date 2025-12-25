from pydantic import BaseModel, ConfigDict, Field


class TextRequest(BaseModel):
  model_config = ConfigDict(extra="forbid")

  object_name: str = Field(default="这件物品")
  category: str = Field(default="杂物")
  context: str | None = None
  tone: str = Field(default="stardew")


class TextResponse(BaseModel):
  model_config = ConfigDict(extra="forbid")

  description: str
