from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.security import get_current_user, get_current_admin
from models.order import Order, OrderItem
from models.product import Product
from models.user import User
from schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate

router = APIRouter()

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Place a new order."""
    total = 0.0
    order_items = []

    # Validate products and calculate total
    for item in order_data.items:
        product = db.query(Product).filter(
            Product.id == item.product_id, Product.is_active == True
        ).first()

        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}. Available: {product.stock}"
            )

        subtotal = product.price * item.quantity
        total += subtotal
        order_items.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": product.price,
            "subtotal": subtotal
        })

    # Create order
    order = Order(
        user_id=current_user.id,
        total_amount=round(total, 2),
        shipping_address=order_data.shipping_address
    )
    db.add(order)
    db.flush()  # Get the order ID without committing

    # Create order items and reduce stock
    for item_data in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"]
        )
        db.add(order_item)
        item_data["product"].stock -= item_data["quantity"]  # Reduce stock

    db.commit()
    db.refresh(order)
    return order

@router.get("/", response_model=List[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all orders for the currently logged-in user."""
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(
        Order.created_at.desc()
    ).all()

@router.get("/all", response_model=List[OrderResponse])
def get_all_orders(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get all orders (admin only)."""
    return db.query(Order).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific order by ID."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    # Users can only see their own orders; admins can see any
    if order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return order

@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update order status (admin only)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order
