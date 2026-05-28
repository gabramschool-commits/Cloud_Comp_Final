from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from core.security import get_current_user, get_current_admin
from models.product import Product
from models.user import User
from schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all products. Supports filtering by category and search."""
    query = db.query(Product).filter(Product.is_active == True)

    if category:
        query = query.filter(Product.category == category)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    return query.offset(skip).limit(limit).all()

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """Get list of all product categories."""
    results = db.query(Product.category).distinct().filter(
        Product.is_active == True, Product.category != None
    ).all()
    return [r[0] for r in results]

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Create a new product. Admin only."""
    product = Product(**product_data.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update a product. Admin only."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in product_data.dict(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Soft-delete a product. Admin only."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()
