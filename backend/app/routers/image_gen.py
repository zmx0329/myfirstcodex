from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import get_image_gen_service
from ..models.image_gen import ImageGenRequest, ImageGenResponse
from ..services.errors import ImageGenerationError
from ..services.image_gen_service import ImageGenerationService

router = APIRouter()


@router.post("/generate-image", response_model=ImageGenResponse)
async def generate_image(
  payload: ImageGenRequest, service: ImageGenerationService = Depends(get_image_gen_service)
) -> ImageGenResponse:
  try:
    return await service.generate(payload)
  except ImageGenerationError as exc:
    raise HTTPException(status_code=exc.status_code or 502, detail={"code": exc.code, "message": exc.message}) from exc
