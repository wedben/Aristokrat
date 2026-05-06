from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PasswordResetRequestCreate(BaseModel):
    email: str


class PasswordResetRequestRead(BaseModel):
    id: int
    user_id: int
    email: str
    full_name: str
    requested_at: datetime
    is_approved: bool
    approved_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    is_completed: bool
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PasswordResetApprove(BaseModel):
    request_id: int


class PasswordResetSetNew(BaseModel):
    request_id: int
    new_password: str

