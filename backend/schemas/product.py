from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int = 0
    category: Optional[str] = None
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
