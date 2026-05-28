from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from models.order import OrderStatus

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    shipping_address: str

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: OrderStatus
    shipping_address: Optional[str]
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True
