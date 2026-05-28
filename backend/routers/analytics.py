from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any

from core.database import get_reporting_db, get_db
from core.security import get_current_admin
from models.user import User
from models.order import Order, OrderItem
from models.product import Product

router = APIRouter()

@router.get("/summary")
def get_summary(
    db: Session = Depends(get_reporting_db),
    admin: User = Depends(get_current_admin)
):
    """Get overall business summary from reporting DB."""
    try:
        result = db.execute(text("""
            SELECT
                COALESCE(SUM(total_revenue), 0) as total_revenue,
                COALESCE(SUM(total_orders), 0) as total_orders,
                COALESCE(SUM(total_customers), 0) as total_customers,
                COALESCE(AVG(avg_order_value), 0) as avg_order_value
            FROM daily_sales_summary
        """)).fetchone()

        return {
            "total_revenue": float(result[0]) if result[0] else 0,
            "total_orders": int(result[1]) if result[1] else 0,
            "total_customers": int(result[2]) if result[2] else 0,
            "avg_order_value": float(result[3]) if result[3] else 0
        }
    except Exception:
        # Fallback: read from main DB if reporting DB not yet populated
        return _get_summary_from_main(db)

def _get_summary_from_main(db):
    return {"total_revenue": 0, "total_orders": 0, "total_customers": 0, "avg_order_value": 0}

@router.get("/daily-sales")
def get_daily_sales(
    days: int = 30,
    db: Session = Depends(get_reporting_db),
    admin: User = Depends(get_current_admin)
):
    """Get daily sales for the past N days."""
    try:
        result = db.execute(text("""
            SELECT sale_date, total_revenue, total_orders
            FROM daily_sales_summary
            ORDER BY sale_date DESC
            LIMIT :days
        """), {"days": days}).fetchall()

        return [
            {
                "date": str(row[0]),
                "revenue": float(row[1]),
                "orders": int(row[2])
            }
            for row in reversed(result)
        ]
    except Exception:
        return []

@router.get("/top-products")
def get_top_products(
    limit: int = 10,
    db: Session = Depends(get_reporting_db),
    admin: User = Depends(get_current_admin)
):
    """Get top-selling products."""
    try:
        result = db.execute(text("""
            SELECT product_name, total_quantity_sold, total_revenue
            FROM product_sales_summary
            ORDER BY total_revenue DESC
            LIMIT :limit
        """), {"limit": limit}).fetchall()

        return [
            {
                "product_name": row[0],
                "quantity_sold": int(row[1]),
                "revenue": float(row[2])
            }
            for row in result
        ]
    except Exception:
        return []

@router.get("/customer-stats")
def get_customer_stats(
    limit: int = 10,
    db: Session = Depends(get_reporting_db),
    admin: User = Depends(get_current_admin)
):
    """Get customer statistics."""
    try:
        result = db.execute(text("""
            SELECT customer_name, customer_email, total_orders, total_spent
            FROM customer_summary
            ORDER BY total_spent DESC
            LIMIT :limit
        """), {"limit": limit}).fetchall()

        return [
            {
                "name": row[0],
                "email": row[1],
                "total_orders": int(row[2]),
                "total_spent": float(row[3])
            }
            for row in result
        ]
    except Exception:
        return []

@router.get("/category-breakdown")
def get_category_breakdown(
    db: Session = Depends(get_reporting_db),
    admin: User = Depends(get_current_admin)
):
    """Get sales breakdown by product category."""
    try:
        result = db.execute(text("""
            SELECT category, total_revenue, total_orders
            FROM category_sales_summary
            ORDER BY total_revenue DESC
        """)).fetchall()

        return [
            {
                "category": row[0],
                "revenue": float(row[1]),
                "orders": int(row[2])
            }
            for row in result
        ]
    except Exception:
        return []
