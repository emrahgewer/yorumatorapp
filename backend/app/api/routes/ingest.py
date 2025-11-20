from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.api import deps
from app.schemas.common import Message

router = APIRouter()


@router.post("/import", response_model=Message)
def import_products(
    file: UploadFile,
    current_user=Depends(deps.get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can import products")
    # TODO: Parse CSV/JSON and create ImportJob entries
    return Message(message="import-received", detail=file.filename)
