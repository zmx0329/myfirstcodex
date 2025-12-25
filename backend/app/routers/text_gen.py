from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import get_text_service
from ..models.text import TextRequest, TextResponse
from ..services.errors import TextGenerationError
from ..services.text_service import TextService

router = APIRouter()


@router.post("/generate-text", response_model=TextResponse)
async def generate_text(payload: TextRequest, service: TextService = Depends(get_text_service)) -> TextResponse:
  try:
    return await service.generate_description(payload)
  except TextGenerationError as exc:
    raise HTTPException(status_code=exc.status_code or 502, detail={"code": exc.code, "message": exc.message}) from exc
