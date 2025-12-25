from __future__ import annotations

from io import BytesIO
from typing import List

from PIL import Image

from ..clients.detection_client import AliyunDetectionClient, AzureDetectionClient
from ..config import Settings
from ..models.common import DetectionBox, ImageSize, NormalizedBounds
from ..models.detection import DetectResponse
from .errors import DetectionError
from .utils import clamp


class DetectionService:
  """Handles object detection with Azure CV or deterministic fallback."""

  def __init__(self, settings: Settings):
    self.settings = settings

  async def detect(self, image_bytes: bytes, max_results: int) -> DetectResponse:
    try:
      image = Image.open(BytesIO(image_bytes))
    except Exception as exc:  # pragma: no cover - defensive
      raise DetectionError("invalid_image", "无法读取图片", status_code=400) from exc

    width, height = image.size

    if self.settings.aliyun_access_key_id and self.settings.aliyun_access_key_secret:
      client = AliyunDetectionClient(
        self.settings.aliyun_access_key_id,
        self.settings.aliyun_access_key_secret,
        self.settings.aliyun_region,
        self.settings.aliyun_endpoint,
      )
      boxes = await client.detect(image_bytes, width, height, max_results)
    elif self.settings.azure_cv_endpoint and self.settings.azure_cv_key:
      client = AzureDetectionClient(self.settings.azure_cv_endpoint, self.settings.azure_cv_key)
      boxes = await client.detect(image_bytes, width, height, max_results)
      if not boxes:
        raise DetectionError("no_objects", "未识别到物体", status_code=422)
    else:
      boxes = self._fallback_boxes(width, height, max_results)

    return DetectResponse(boxes=boxes, image_size=ImageSize(width=width, height=height))

  def _fallback_boxes(self, width: int, height: int, max_results: int) -> List[DetectionBox]:
    aspect = width / height if height else 1.0
    if aspect >= 1:
      specs = [
        {"x": 0.2, "y": 0.16, "w": 0.48, "h": 0.42, "label": "主物体", "conf": 0.9},
        {"x": 0.65, "y": 0.2, "w": 0.22, "h": 0.26, "label": "前景物体", "conf": 0.82},
        {"x": 0.28, "y": 0.58, "w": 0.26, "h": 0.28, "label": "次物体", "conf": 0.76},
      ]
    else:
      specs = [
        {"x": 0.22, "y": 0.12, "w": 0.44, "h": 0.5, "label": "主物体", "conf": 0.9},
        {"x": 0.18, "y": 0.64, "w": 0.28, "h": 0.26, "label": "左侧物体", "conf": 0.78},
        {"x": 0.58, "y": 0.64, "w": 0.24, "h": 0.26, "label": "右侧物体", "conf": 0.74},
      ]

    boxes: list[DetectionBox] = []
    for index, spec in enumerate(specs):
      if index >= max_results:
        break
      bounds = NormalizedBounds(
        x=clamp(spec["x"], 0, 1),
        y=clamp(spec["y"], 0, 1),
        width=clamp(spec["w"], 0.05, 0.95),
        height=clamp(spec["h"], 0.05, 0.95),
      )
      boxes.append(
        DetectionBox(
          id=f"box-{index + 1}",
          label=spec["label"],
          confidence=spec["conf"],
          bounds=bounds,
        )
      )

    if not boxes:  # pragma: no cover - defensive, should not happen
      boxes.append(
        DetectionBox(
          id="box-1",
          label="物体",
          confidence=0.7,
          bounds=NormalizedBounds(x=0.25, y=0.25, width=0.4, height=0.4),
        )
      )

    return boxes
