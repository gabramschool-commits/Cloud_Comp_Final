import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Main transactional database
MAIN_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://shopuser:shoppassword@localhost:5432/shopdb"
)

# Reporting/analytics database
REPORTING_DATABASE_URL = os.getenv(
    "REPORTING_DATABASE_URL",
    "postgresql://shopuser:shoppassword@localhost:5432/shopreporting"
)

# Main DB engine
engine = create_engine(MAIN_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Reporting DB engine
reporting_engine = create_engine(REPORTING_DATABASE_URL)
ReportingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=reporting_engine)

Base = declarative_base()
ReportingBase = declarative_base()

# Dependency: get main DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency: get reporting DB session
def get_reporting_db():
    db = ReportingSessionLocal()
    try:
        yield db
    finally:
        db.close()
