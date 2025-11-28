from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserActivityRead(BaseModel):
    id: int
    user_id: int
    activity_type: str
    target_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TestResultRead(BaseModel):
    id: int
    user_id: int
    test_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    score: int
    max_score: int
    is_passed: bool

    class Config:
        from_attributes = True

class UserStatsRead(BaseModel):
    user_id: int
    full_name: str
    email: str
    is_active: bool
    is_pending_verification: Optional[bool] = False
    total_card_views: int
    total_tests_completed: int
    total_tests_passed: int
    last_activity: Optional[datetime] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CardViewRead(BaseModel):
    id: int
    user_id: int
    card_id: int
    viewed_at: datetime

    class Config:
        from_attributes = True
