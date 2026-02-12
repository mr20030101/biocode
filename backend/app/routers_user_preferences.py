import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .auth import get_current_user, get_db
from .models import User

router = APIRouter(prefix="/users/me", tags=["user-preferences"])


class UserPreferences(BaseModel):
    default_view_mode: str = "horizontal"  # table, horizontal, grid
    sidebar_collapsed: bool = False


@router.get("/preferences", response_model=UserPreferences)
def get_user_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's preferences"""
    if not current_user.preferences:
        # Return default preferences
        return UserPreferences()
    
    try:
        prefs_dict = json.loads(current_user.preferences)
        return UserPreferences(**prefs_dict)
    except (json.JSONDecodeError, TypeError):
        # If preferences are corrupted, return defaults
        return UserPreferences()


@router.put("/preferences", response_model=UserPreferences)
def update_user_preferences(
    preferences: UserPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's preferences"""
    # Validate view mode
    valid_view_modes = ["table", "horizontal", "grid"]
    if preferences.default_view_mode not in valid_view_modes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid view mode. Must be one of: {', '.join(valid_view_modes)}"
        )
    
    # Convert to JSON string
    prefs_json = json.dumps(preferences.model_dump())
    
    # Update user preferences
    current_user.preferences = prefs_json
    db.commit()
    db.refresh(current_user)
    
    return preferences
