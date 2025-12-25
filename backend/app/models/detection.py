from pydantic import BaseModel, ConfigDict, Field

from .common import DetectionBox, ImageSize


class DetectRequest(BaseModel):
  model_config = ConfigDict(extra="forbid")

  image_base64: str
  max_results: int = Field(default=5, ge=1, le=20)


class DetectResponse(BaseModel):
  model_config = ConfigDict(extra="forbid")

  boxes: list[DetectionBox]
  image_size: ImageSize
