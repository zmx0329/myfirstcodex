from fastapi import FastAPI

from .config import get_settings
from .routers import artworks, detect, health, text_gen, image_gen


def create_app() -> FastAPI:
  settings = get_settings()
  app = FastAPI(title="Memory Bank Backend", version="0.1.0")

  app.include_router(health.router)
  app.include_router(detect.router)
  app.include_router(text_gen.router)
  app.include_router(image_gen.router)
  app.include_router(artworks.router)

  @app.get("/config/storage")
  async def storage_mode() -> dict[str, str]:
    mode = "local" if settings.use_local_storage else "supabase"
    return {"mode": mode}

  return app


app = create_app()
