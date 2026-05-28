#!/usr/bin/env python3
"""
etl_pipeline.py - ETL Pipeline
Extracts data from the main transactional database,
transforms it into analytics-friendly format,
and loads it into the reporting database.

This script is safe to run multiple times (idempotent).
Schedule with cron: */15 * * * * /path/to/run_etl.sh
"""

import os
import sys
import logging
from datetime import datetime, date, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ─── Logging Setup ─────────────────────────────────────────────────
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "etl.log")),
        logging.StreamHandler(sys.stdout)
    ]
)
log = logging.getLogger(__name__)

# ─── Database Connection Strings ───────────────────────────────────
MAIN_DB = os.getenv("DATABASE_URL", "postgresql://shopuser:shoppassword@localhost:5432/shopdb")
REPORT_DB = os.getenv("REPORTING_DATABASE_URL", "postgresql://shopuser:shoppassword@localhost:5432/shopreporting")


def get_conn(dsn: str):
    """Open a database connection."""
    return psycopg2.connect(dsn)


# ─── Step 1: Setup Reporting DB Schema ─────────────────────────────
def setup_reporting_schema(conn):
    """Create reporting tables if they don't exist."""
    log.info("Setting up reporting schema...")

    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS daily_sales_summary (
                id SERIAL PRIMARY KEY,
                sale_date DATE UNIQUE NOT NULL,
                total_revenue NUMERIC(12,2) DEFAULT 0,
                total_orders INTEGER DEFAULT 0,
                total_customers INTEGER DEFAULT 0,
                avg_order_value NUMERIC(10,2) DEFAULT 0,
                last_updated TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS product_sales_summary (
                id SERIAL PRIMARY KEY,
                product_id INTEGER NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                total_quantity_sold INTEGER DEFAULT 0,
                total_revenue NUMERIC(12,2) DEFAULT 0,
                last_updated TIMESTAMP DEFAULT NOW(),
                UNIQUE(product_id)
            );

            CREATE TABLE IF NOT EXISTS customer_summary (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                customer_name VARCHAR(255),
                customer_email VARCHAR(255),
                total_orders INTEGER DEFAULT 0,
                total_spent NUMERIC(12,2) DEFAULT 0,
                first_order_date DATE,
                last_order_date DATE,
                last_updated TIMESTAMP DEFAULT NOW(),
                UNIQUE(customer_id)
            );

            CREATE TABLE IF NOT EXISTS category_sales_summary (
                id SERIAL PRIMARY KEY,
                category VARCHAR(100) UNIQUE NOT NULL,
                total_revenue NUMERIC(12,2) DEFAULT 0,
                total_orders INTEGER DEFAULT 0,
                last_updated TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS etl_log (
                id SERIAL PRIMARY KEY,
                run_at TIMESTAMP DEFAULT NOW(),
                status VARCHAR(20),
                records_processed INTEGER DEFAULT 0,
                message TEXT
            );
        """)
    conn.commit()
    log.info("✅ Reporting schema ready")


# ─── Step 2: Extract ────────────────────────────────────────────────
def extract_data(main_conn):
    """Extract all needed data from the main transactional database."""
    log.info("Extracting data from main database...")

    with main_conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Daily sales
        cur.execute("""
            SELECT
                DATE(o.created_at) AS sale_date,
                COUNT(DISTINCT o.id) AS total_orders,
                COUNT(DISTINCT o.user_id) AS total_customers,
                COALESCE(SUM(o.total_amount), 0) AS total_revenue,
                COALESCE(AVG(o.total_amount), 0) AS avg_order_value
            FROM orders o
            WHERE o.status != 'cancelled'
            GROUP BY DATE(o.created_at)
            ORDER BY sale_date
        """)
        daily_sales = cur.fetchall()

        # Product sales
        cur.execute("""
            SELECT
                oi.product_id,
                p.name AS product_name,
                p.category,
                SUM(oi.quantity) AS total_quantity_sold,
                SUM(oi.subtotal) AS total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY oi.product_id, p.name, p.category
        """)
        product_sales = cur.fetchall()

        # Customer summary
        cur.execute("""
            SELECT
                u.id AS customer_id,
                u.full_name AS customer_name,
                u.email AS customer_email,
                COUNT(o.id) AS total_orders,
                COALESCE(SUM(o.total_amount), 0) AS total_spent,
                MIN(DATE(o.created_at)) AS first_order_date,
                MAX(DATE(o.created_at)) AS last_order_date
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
            WHERE u.is_admin = FALSE
            GROUP BY u.id, u.full_name, u.email
        """)
        customer_data = cur.fetchall()

        # Category breakdown
        cur.execute("""
            SELECT
                COALESCE(p.category, 'Uncategorized') AS category,
                COUNT(DISTINCT o.id) AS total_orders,
                SUM(oi.subtotal) AS total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY p.category
        """)
        category_data = cur.fetchall()

    log.info(f"  Extracted: {len(daily_sales)} days, {len(product_sales)} products, "
             f"{len(customer_data)} customers, {len(category_data)} categories")

    return {
        "daily_sales": daily_sales,
        "product_sales": product_sales,
        "customer_data": customer_data,
        "category_data": category_data
    }


# ─── Step 3: Transform ──────────────────────────────────────────────
def transform_data(raw_data):
    """Clean and transform the extracted data."""
    log.info("Transforming data...")

    transformed = {
        "daily_sales": [],
        "product_sales": [],
        "customer_data": [],
        "category_data": []
    }

    for row in raw_data["daily_sales"]:
        transformed["daily_sales"].append({
            "sale_date": row["sale_date"],
            "total_revenue": round(float(row["total_revenue"]), 2),
            "total_orders": int(row["total_orders"]),
            "total_customers": int(row["total_customers"]),
            "avg_order_value": round(float(row["avg_order_value"]), 2)
        })

    for row in raw_data["product_sales"]:
        transformed["product_sales"].append({
            "product_id": int(row["product_id"]),
            "product_name": str(row["product_name"]),
            "category": str(row["category"]) if row["category"] else "Uncategorized",
            "total_quantity_sold": int(row["total_quantity_sold"]),
            "total_revenue": round(float(row["total_revenue"]), 2)
        })

    for row in raw_data["customer_data"]:
        transformed["customer_data"].append({
            "customer_id": int(row["customer_id"]),
            "customer_name": str(row["customer_name"]),
            "customer_email": str(row["customer_email"]),
            "total_orders": int(row["total_orders"]),
            "total_spent": round(float(row["total_spent"]), 2),
            "first_order_date": row["first_order_date"],
            "last_order_date": row["last_order_date"]
        })

    for row in raw_data["category_data"]:
        transformed["category_data"].append({
            "category": str(row["category"]),
            "total_orders": int(row["total_orders"]),
            "total_revenue": round(float(row["total_revenue"]), 2)
        })

    log.info("✅ Transform complete")
    return transformed


# ─── Step 4: Load ───────────────────────────────────────────────────
def load_data(report_conn, data):
    """Load transformed data into the reporting database (upsert)."""
    log.info("Loading data into reporting database...")
    total_records = 0

    with report_conn.cursor() as cur:
        # Load daily sales
        for row in data["daily_sales"]:
            cur.execute("""
                INSERT INTO daily_sales_summary
                    (sale_date, total_revenue, total_orders, total_customers, avg_order_value, last_updated)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (sale_date) DO UPDATE SET
                    total_revenue = EXCLUDED.total_revenue,
                    total_orders = EXCLUDED.total_orders,
                    total_customers = EXCLUDED.total_customers,
                    avg_order_value = EXCLUDED.avg_order_value,
                    last_updated = NOW()
            """, (row["sale_date"], row["total_revenue"], row["total_orders"],
                  row["total_customers"], row["avg_order_value"]))
            total_records += 1

        # Load product sales
        for row in data["product_sales"]:
            cur.execute("""
                INSERT INTO product_sales_summary
                    (product_id, product_name, category, total_quantity_sold, total_revenue, last_updated)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (product_id) DO UPDATE SET
                    product_name = EXCLUDED.product_name,
                    category = EXCLUDED.category,
                    total_quantity_sold = EXCLUDED.total_quantity_sold,
                    total_revenue = EXCLUDED.total_revenue,
                    last_updated = NOW()
            """, (row["product_id"], row["product_name"], row["category"],
                  row["total_quantity_sold"], row["total_revenue"]))
            total_records += 1

        # Load customer data
        for row in data["customer_data"]:
            cur.execute("""
                INSERT INTO customer_summary
                    (customer_id, customer_name, customer_email, total_orders,
                     total_spent, first_order_date, last_order_date, last_updated)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (customer_id) DO UPDATE SET
                    customer_name = EXCLUDED.customer_name,
                    customer_email = EXCLUDED.customer_email,
                    total_orders = EXCLUDED.total_orders,
                    total_spent = EXCLUDED.total_spent,
                    first_order_date = EXCLUDED.first_order_date,
                    last_order_date = EXCLUDED.last_order_date,
                    last_updated = NOW()
            """, (row["customer_id"], row["customer_name"], row["customer_email"],
                  row["total_orders"], row["total_spent"],
                  row["first_order_date"], row["last_order_date"]))
            total_records += 1

        # Load category data
        for row in data["category_data"]:
            cur.execute("""
                INSERT INTO category_sales_summary
                    (category, total_revenue, total_orders, last_updated)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (category) DO UPDATE SET
                    total_revenue = EXCLUDED.total_revenue,
                    total_orders = EXCLUDED.total_orders,
                    last_updated = NOW()
            """, (row["category"], row["total_revenue"], row["total_orders"]))
            total_records += 1

    report_conn.commit()
    log.info(f"✅ Loaded {total_records} records into reporting DB")
    return total_records


# ─── ETL Log ────────────────────────────────────────────────────────
def log_etl_run(report_conn, status: str, records: int, message: str = ""):
    with report_conn.cursor() as cur:
        cur.execute("""
            INSERT INTO etl_log (status, records_processed, message)
            VALUES (%s, %s, %s)
        """, (status, records, message))
    report_conn.commit()


# ─── Main Entry Point ───────────────────────────────────────────────
def run_etl():
    start = datetime.now()
    log.info("=" * 50)
    log.info(f"ETL Pipeline started at {start}")
    log.info("=" * 50)

    main_conn = None
    report_conn = None

    try:
        main_conn = get_conn(MAIN_DB)
        report_conn = get_conn(REPORT_DB)

        setup_reporting_schema(report_conn)
        raw_data = extract_data(main_conn)
        transformed = transform_data(raw_data)
        records = load_data(report_conn, transformed)

        duration = (datetime.now() - start).seconds
        log.info(f"✅ ETL completed in {duration}s — {records} records processed")
        log_etl_run(report_conn, "success", records, f"Completed in {duration}s")

    except Exception as e:
        log.error(f"❌ ETL FAILED: {e}", exc_info=True)
        if report_conn:
            try:
                log_etl_run(report_conn, "error", 0, str(e))
            except Exception:
                pass
        sys.exit(1)

    finally:
        if main_conn:
            main_conn.close()
        if report_conn:
            report_conn.close()


if __name__ == "__main__":
    run_etl()
