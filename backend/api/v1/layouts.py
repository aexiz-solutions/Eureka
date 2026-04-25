from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.api_response import success_response
from core.deps import get_current_user
from db.session import get_db
from models.user import User
from schemas.layout import LayoutCreateRequest, LayoutRead
from services.layout_service import create_layout_for_user

router = APIRouter(prefix="/api/v1/layouts", tags=["layouts"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_layout(
    payload: LayoutCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    layout = await create_layout_for_user(db, current_user, payload)
    response_data = LayoutRead.model_validate(layout).model_dump(mode="json")
    return success_response(response_data, "Layout created successfully.")