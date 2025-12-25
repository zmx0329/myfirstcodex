from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import get_detection_service
from ..models.detection import DetectRequest, DetectResponse
from ..services.detection_service import DetectionService
from ..services.errors import DetectionError, ImageGenerationError
from ..services.utils import decode_base64_image

router = APIRouter()


@router.post("/detect", response_model=DetectResponse)
async def detect_objects(
  payload: DetectRequest, service: DetectionService = Depends(get_detection_service)
) -> DetectResponse:
  try:
    image_bytes = decode_base64_image(payload.image_base64)
    return await service.detect(image_bytes, payload.max_results)
  except ImageGenerationError as exc:
    raise HTTPException(status_code=400, detail={"code": exc.code, "message": exc.message}) from exc
  except DetectionError as exc:
    raise HTTPException(status_code=exc.status_code or 502, detail={"code": exc.code, "message": exc.message}) from exc
