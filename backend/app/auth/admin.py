from fastapi import Depends, HTTPException, status

from app.auth.deps import current_user
from app.auth.models import User


async def admin_only(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required.",
        )
    return user
