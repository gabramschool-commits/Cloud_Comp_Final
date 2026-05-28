from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.database import engine, Base
from routers import auth, products, orders, users, analytics

# Create all database tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="ShopEase E-Commerce API",
    description="Full-stack e-commerce backend with analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route groups
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
def root():
    return {"message": "ShopEase API is running!", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
