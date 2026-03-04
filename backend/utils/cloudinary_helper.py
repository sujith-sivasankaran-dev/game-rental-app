import cloudinary
import cloudinary.uploader
from typing import Optional, Tuple
import logging
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

def _get_cloudinary_settings():
    """Get Cloudinary settings fresh from environment"""
    # Try to reload .env in case it changed
    load_dotenv(override=True)
    return {
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME", ""),
        "api_key": os.getenv("CLOUDINARY_API_KEY", ""),
        "api_secret": os.getenv("CLOUDINARY_API_SECRET", "")
    }

def _configure_cloudinary():
    """Configure Cloudinary with fresh environment variables"""
    settings = _get_cloudinary_settings()
    cloudinary.config(
        cloud_name=settings["cloud_name"],
        api_key=settings["api_key"],
        api_secret=settings["api_secret"]
    )
    return settings

def get_cloudinary_config() -> dict:
    """Return current Cloudinary configuration (without exposing secrets)"""
    settings = _get_cloudinary_settings()
    return {
        "cloud_name": settings["cloud_name"],
        "api_key_set": bool(settings["api_key"]),
        "api_secret_set": bool(settings["api_secret"]),
        "api_key_preview": settings["api_key"][:4] + "..." if settings["api_key"] else "NOT SET"
    }

def upload_image(file_content: bytes, filename: str, folder: str = "ss_gaming_rentals") -> Tuple[Optional[str], Optional[str]]:
    """
    Upload image to Cloudinary and return the URL
    Returns: (url, error_message) - url is None if failed, error_message is None if success
    """
    try:
        # Configure Cloudinary fresh on each upload to pick up any env var changes
        settings = _configure_cloudinary()
        
        logger.info(f"Attempting Cloudinary upload: filename={filename}, folder={folder}, content_size={len(file_content)} bytes")
        logger.info(f"Cloudinary config: cloud_name={settings['cloud_name']}, api_key={settings['api_key'][:4] if settings['api_key'] else 'EMPTY'}...")
        
        if not settings['cloud_name'] or not settings['api_key'] or not settings['api_secret']:
            return None, "Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET environment variables."
        
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            public_id=filename,
            overwrite=True,
            resource_type="image"
        )
        url = result.get("secure_url")
        logger.info(f"Cloudinary upload successful: {url}")
        return url, None
    except Exception as e:
        error_msg = f"Cloudinary upload failed: {str(e)}"
        logger.error(error_msg)
        print(error_msg)  # Also print to stdout for visibility
        return None, error_msg

def delete_image(public_id: str) -> bool:
    """
    Delete image from Cloudinary
    """
    try:
        _configure_cloudinary()  # Ensure fresh config
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        print(f"Error deleting from Cloudinary: {str(e)}")
        return False