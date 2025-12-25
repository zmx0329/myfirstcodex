from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  """Application settings loaded from environment."""

  azure_cv_endpoint: Optional[str] = None
  azure_cv_key: Optional[str] = None

  aliyun_access_key_id: Optional[str] = None
  aliyun_access_key_secret: Optional[str] = None
  aliyun_region: str = "cn-shanghai"
  aliyun_endpoint: str = "objectdet.cn-shanghai.aliyuncs.com"

  image_gen_endpoint: Optional[str] = None
  image_gen_key: Optional[str] = None
  image_gen_model: str = "gemini-3-pro-image-preview"

  text_gen_endpoint: Optional[str] = None
  text_gen_key: Optional[str] = None

  supabase_url: Optional[str] = None
  supabase_key: Optional[str] = None
  supabase_bucket: str = "artworks"
  supabase_table: str = "artworks"

  local_storage_dir: Path = Path("backend/storage")

  model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

  @property
  def use_local_storage(self) -> bool:
    """Return True when Supabase credentials are not fully provided."""
    return not (self.supabase_url and self.supabase_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
  return Settings()
