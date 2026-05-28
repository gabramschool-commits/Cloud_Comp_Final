from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.security import get_current_user, get_current_admin, get_password_hash
from models.user import User
from schemas.user import UserResponse, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get the current user's profile."""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_my_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the current user's profile."""
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """List all users (admin only)."""
    return db.query(User).offset(skip).limit(limit).all()

@router.put("/{user_id}/toggle-admin", response_model=UserResponse)
def toggle_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Toggle admin status for a user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = not user.is_admin
    db.commit()
    db.refresh(user)
    return user
