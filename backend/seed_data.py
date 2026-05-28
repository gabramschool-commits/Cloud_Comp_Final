"""
seed_data.py - Run this once to populate the database with sample data.
Usage: python seed_data.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal, engine, Base
from core.security import get_password_hash
from models.user import User
from models.product import Product
from models.order import Order, OrderItem
import models  # ensures all models are registered

def seed():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create admin user
        if not db.query(User).filter(User.email == "admin@shopease.com").first():
            admin = User(
                full_name="Admin User",
                email="admin@shopease.com",
                hashed_password=get_password_hash("admin123"),
                is_admin=True
            )
            db.add(admin)
            print("✅ Admin user created: admin@shopease.com / admin123")

        # Create test customer
        if not db.query(User).filter(User.email == "customer@example.com").first():
            customer = User(
                full_name="Jane Customer",
                email="customer@example.com",
                hashed_password=get_password_hash("customer123"),
                is_admin=False
            )
            db.add(customer)
            print("✅ Test customer created: customer@example.com / customer123")

        db.flush()

        # Create sample products
        products_data = [
            {"name": "Wireless Headphones", "description": "Premium noise-cancelling wireless headphones with 30hr battery.", "price": 89.99, "stock": 50, "category": "Electronics", "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"},
            {"name": "Running Shoes", "description": "Lightweight and breathable running shoes for everyday training.", "price": 65.00, "stock": 30, "category": "Footwear", "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"},
            {"name": "Laptop Backpack", "description": "Water-resistant 30L backpack with dedicated laptop compartment.", "price": 45.50, "stock": 75, "category": "Bags", "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"},
            {"name": "Smart Watch", "description": "Fitness tracker with heart rate monitor and GPS.", "price": 129.99, "stock": 20, "category": "Electronics", "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"},
            {"name": "Coffee Maker", "description": "12-cup programmable drip coffee maker with built-in grinder.", "price": 59.99, "stock": 15, "category": "Kitchen", "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400"},
            {"name": "Yoga Mat", "description": "Non-slip eco-friendly yoga mat 6mm thick.", "price": 29.99, "stock": 100, "category": "Sports", "image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400"},
            {"name": "Sunglasses", "description": "UV400 polarized lenses with lightweight titanium frame.", "price": 39.99, "stock": 60, "category": "Accessories", "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400"},
            {"name": "Desk Lamp", "description": "LED desk lamp with adjustable brightness and USB charging port.", "price": 34.99, "stock": 40, "category": "Home Office", "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"},
            {"name": "Water Bottle", "description": "Insulated stainless steel water bottle, keeps cold 24h.", "price": 24.99, "stock": 200, "category": "Sports", "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400"},
            {"name": "Bluetooth Speaker", "description": "Portable waterproof Bluetooth 5.0 speaker, 12hr playtime.", "price": 49.99, "stock": 35, "category": "Electronics", "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"},
            {"name": "Casual T-Shirt", "description": "100% organic cotton crew neck t-shirt.", "price": 19.99, "stock": 120, "category": "Clothing", "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"},
            {"name": "Mechanical Keyboard", "description": "TKL mechanical keyboard with Cherry MX Blue switches.", "price": 79.99, "stock": 25, "category": "Electronics", "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400"},
        ]

        for p_data in products_data:
            if not db.query(Product).filter(Product.name == p_data["name"]).first():
                product = Product(**p_data)
                db.add(product)

        db.commit()
        print(f"✅ {len(products_data)} sample products created")

        # Create sample orders
        customer = db.query(User).filter(User.email == "customer@example.com").first()
        products = db.query(Product).all()

        if customer and products and db.query(Order).count() == 0:
            # Create 3 sample orders
            orders_data = [
                {
                    "items": [(products[0], 1), (products[2], 1)],
                    "shipping_address": "123 Main St, Anytown, USA"
                },
                {
                    "items": [(products[3], 1)],
                    "shipping_address": "456 Oak Ave, Springfield, USA"
                },
                {
                    "items": [(products[5], 2), (products[8], 1)],
                    "shipping_address": "789 Pine Rd, Shelbyville, USA"
                }
            ]

            for order_data in orders_data:
                total = sum(p.price * qty for p, qty in order_data["items"])
                order = Order(
                    user_id=customer.id,
                    total_amount=round(total, 2),
                    shipping_address=order_data["shipping_address"],
                    status="delivered"
                )
                db.add(order)
                db.flush()

                for product, qty in order_data["items"]:
                    item = OrderItem(
                        order_id=order.id,
                        product_id=product.id,
                        quantity=qty,
                        unit_price=product.price,
                        subtotal=product.price * qty
                    )
                    db.add(item)

            db.commit()
            print("✅ Sample orders created")

        print("\n🎉 Database seeded successfully!")
        print("=" * 40)
        print("Admin login:    admin@shopease.com / admin123")
        print("Customer login: customer@example.com / customer123")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
