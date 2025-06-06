"""Users API module."""

from fastapi import APIRouter

router = APIRouter()

@router.get("/profile")
async def get_user_profile():
    """Get user profile - placeholder."""
    return {"message": "User profile endpoint - coming soon"}

users_router = router
