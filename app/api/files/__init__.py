"""Files API module."""

from fastapi import APIRouter

router = APIRouter()

@router.post("/upload")
async def upload_file():
    """Upload file - placeholder."""
    return {"message": "File upload endpoint - coming soon"}

@router.get("/")
async def list_files():
    """List files - placeholder."""
    return {"message": "File listing endpoint - coming soon"}

files_router = router
