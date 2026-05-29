# ShopEase — Full-Stack E-Commerce System
## Project Documentation

---

## 1. Project Overview

ShopEase is a full-stack e-commerce web application built as a final project demonstrating
modern software engineering principles including REST API design, database architecture,
ETL pipelines, and cloud deployment.

---

## 2. System Architecture

```
                          ┌─────────────────────────────────────┐
                          │          Ubuntu VPS (Hostinger)      │
                          │                                       │
  User's Browser  ──────► │  nginx (Port 80)                     │
                          │     │                                 │
                          │     ├── /          → React Frontend   │
                          │     │              (dist/ folder)     │
                          │     │                                 │
                          │     └── /api/      → FastAPI Backend  │
                          │                    (Port 8000)        │
                          │                         │             │
                          │              ┌──────────┴─────────┐  │
                          │              │                     │  │
                          │        PostgreSQL DB        PostgreSQL │
                          │        (shopdb)             Reporting │
                          │        Main transactions    (shopreporting)│
                          │              │                     │  │
                          │              └─── ETL Pipeline ────┘  │
                          │              (cron every 15 minutes)   │
                          └─────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer       | Technology      | Purpose                            |
|-------------|-----------------|-------------------------------------|
| Frontend    | React + Vite    | UI framework                        |
| Styling     | TailwindCSS     | Utility-first CSS                   |
| State Mgmt  | Zustand         | Global state (auth, cart)           |
| Charts      | Recharts        | Analytics visualizations            |
| HTTP Client | Axios           | API calls from frontend             |
| Routing     | React Router v6 | Client-side page routing            |
| Backend     | FastAPI         | REST API framework                  |
| ORM         | SQLAlchemy      | Database object mapper              |
| Validation  | Pydantic        | Request/response schemas            |
| Auth        | JWT (jose)      | Stateless authentication            |
| Passwords   | bcrypt          | Password hashing                    |
| ASGI Server | uvicorn         | Production Python web server        |
| Main DB     | PostgreSQL      | Transactional data storage          |
| Report DB   | PostgreSQL      | Analytics/reporting data            |
| ETL         | Python          | Data extraction, transform, load    |
| Scheduler   | Linux cron      | Automated ETL scheduling            |
| Web Server  | nginx           | Reverse proxy + static file serving |
| Process Mgr | systemd         | Auto-restart backend service        |
| Deployment  | Ubuntu VPS      | Cloud hosting                       |

---

## 4. Database Schema

### Main Database (shopdb)

**users** — Stores customer and admin accounts
```
id            SERIAL PRIMARY KEY
full_name     VARCHAR(100)
email         VARCHAR(255) UNIQUE
hashed_password VARCHAR(255)
is_admin      BOOLEAN
is_active     BOOLEAN
created_at    TIMESTAMP
```

**products** — Product catalog
```
id            SERIAL PRIMARY KEY
name          VARCHAR(255)
description   TEXT
price         FLOAT
stock         INTEGER
category      VARCHAR(100)
image_url     VARCHAR(500)
is_active     BOOLEAN
created_at    TIMESTAMP
```

**orders** — Customer orders
```
id              SERIAL PRIMARY KEY
user_id         FK → users.id
total_amount    FLOAT
status          ENUM (pending/processing/shipped/delivered/cancelled)
shipping_address VARCHAR(500)
created_at      TIMESTAMP
```

**order_items** — Individual items within an order
```
id            SERIAL PRIMARY KEY
order_id      FK → orders.id
product_id    FK → products.id
quantity      INTEGER
unit_price    FLOAT
subtotal      FLOAT
```

### Reporting Database (shopreporting)

**daily_sales_summary** — Aggregated daily metrics
```
sale_date         DATE UNIQUE
total_revenue     NUMERIC(12,2)
total_orders      INTEGER
total_customers   INTEGER
avg_order_value   NUMERIC(10,2)
last_updated      TIMESTAMP
```

**product_sales_summary** — Per-product totals
```
product_id          INTEGER UNIQUE
product_name        VARCHAR(255)
category            VARCHAR(100)
total_quantity_sold INTEGER
total_revenue       NUMERIC(12,2)
last_updated        TIMESTAMP
```

**customer_summary** — Per-customer totals
```
customer_id       INTEGER UNIQUE
customer_name     VARCHAR(255)
customer_email    VARCHAR(255)
total_orders      INTEGER
total_spent       NUMERIC(12,2)
first_order_date  DATE
last_order_date   DATE
last_updated      TIMESTAMP
```

**category_sales_summary** — Sales by category
```
category        VARCHAR(100) UNIQUE
total_revenue   NUMERIC(12,2)
total_orders    INTEGER
last_updated    TIMESTAMP
```

**etl_log** — Audit trail of ETL runs
```
id                  SERIAL PRIMARY KEY
run_at              TIMESTAMP
status              VARCHAR(20)
records_processed   INTEGER
message             TEXT
```

---

## 5. API Endpoints

### Authentication
| Method | Endpoint            | Description              | Auth Required |
|--------|---------------------|--------------------------|---------------|
| POST   | /api/auth/register  | Create new account       | No            |
| POST   | /api/auth/login     | Login, get JWT token     | No            |

### Products
| Method | Endpoint               | Description              | Auth Required |
|--------|------------------------|--------------------------|---------------|
| GET    | /api/products/         | List all products        | No            |
| GET    | /api/products/{id}     | Get one product          | No            |
| GET    | /api/products/categories | List categories        | No            |
| POST   | /api/products/         | Create product           | Admin only    |
| PUT    | /api/products/{id}     | Update product           | Admin only    |
| DELETE | /api/products/{id}     | Delete product           | Admin only    |

### Orders
| Method | Endpoint               | Description              | Auth Required |
|--------|------------------------|--------------------------|---------------|
| POST   | /api/orders/           | Place an order           | User          |
| GET    | /api/orders/           | Get my orders            | User          |
| GET    | /api/orders/all        | Get all orders           | Admin only    |
| GET    | /api/orders/{id}       | Get order details        | User/Admin    |
| PUT    | /api/orders/{id}/status | Update order status     | Admin only    |

### Analytics (reads from reporting DB)
| Method | Endpoint                       | Description              | Auth Required |
|--------|--------------------------------|--------------------------|---------------|
| GET    | /api/analytics/summary         | Business summary         | Admin only    |
| GET    | /api/analytics/daily-sales     | Revenue by day           | Admin only    |
| GET    | /api/analytics/top-products    | Top-selling products     | Admin only    |
| GET    | /api/analytics/customer-stats  | Customer spending        | Admin only    |
| GET    | /api/analytics/category-breakdown | Sales by category     | Admin only    |

---

## 6. ETL Pipeline Design

The ETL (Extract-Transform-Load) pipeline is a Python script that:

1. **Extract**: Reads raw order data from the main PostgreSQL database
2. **Transform**: Aggregates data into meaningful summaries (daily sales, product totals, etc.)
3. **Load**: Inserts/updates the reporting database using UPSERT (ON CONFLICT DO UPDATE)
4. **Idempotent**: Safe to run multiple times — re-running doesn't create duplicates
5. **Logged**: Every run is logged to a file and the etl_log table
6. **Scheduled**: Runs automatically every 15 minutes via Linux cron job

---

## 7. Security Features

- Passwords hashed with bcrypt (one-way hash, cannot be reversed)
- JWT tokens expire after 60 minutes
- Admin-only endpoints protected by role check middleware
- CORS configured (restrict origins in production)
- PostgreSQL users have minimum required permissions
- nginx strips sensitive headers

---

## 8. Folder Structure

```
ecommerce/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── requirements.txt     # Python dependencies
│   ├── seed_data.py         # Database seeder
│   ├── .env.example         # Environment variable template
│   ├── core/
│   │   ├── database.py      # DB connections (main + reporting)
│   │   └── security.py      # JWT, password hashing, auth middleware
│   ├── models/
│   │   ├── user.py          # User table definition
│   │   ├── product.py       # Product table definition
│   │   └── order.py         # Order + OrderItem table definitions
│   ├── schemas/
│   │   ├── user.py          # Request/response schemas
│   │   ├── product.py
│   │   └── order.py
│   ├── routers/
│   │   ├── auth.py          # Login, register endpoints
│   │   ├── products.py      # Product CRUD
│   │   ├── orders.py        # Order processing
│   │   ├── users.py         # User management
│   │   └── analytics.py     # Reporting endpoints
│   └── etl/
│       ├── etl_pipeline.py  # Main ETL script
│       └── run_etl.sh       # Shell wrapper for cron
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx           # Root with routing
│       ├── main.jsx          # React entry point
│       ├── index.css         # Global styles
│       ├── store/
│       │   └── index.js      # Auth + Cart state (Zustand)
│       ├── services/
│       │   └── api.js        # Axios API client
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   └── Footer.jsx
│       │   └── ui/
│       │       ├── ProductCard.jsx
│       │       └── Spinner.jsx
│       └── pages/
│           ├── HomePage.jsx
│           ├── ProductsPage.jsx
│           ├── ProductDetailPage.jsx
│           ├── CartPage.jsx
│           ├── CheckoutPage.jsx
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── OrdersPage.jsx
│           ├── AdminDashboard.jsx
│           ├── ReportingDashboard.jsx
│           └── NotFoundPage.jsx
├── nginx/
│   └── shopease.conf         # nginx config
├── systemd/
│   └── shopease.service      # systemd service file
└── docs/
    ├── DEPLOYMENT_GUIDE.md   # Full deployment instructions
    └── DOCUMENTATION.md      # This file
```

---

## 9. Group Member Contributions

(Fill in your actual contributions)

| Member | Role           | Responsibilities                             |
|--------|----------------|----------------------------------------------|
| Emmanuel Sevilla | Backend Dev    | FastAPI, SQLAlchemy models, JWT auth         |
| Gabriella Mae Lapad | Frontend Dev   | React pages, Zustand store, TailwindCSS      |
| Gabriel Mar Ramirez | DevOps/DB      | PostgreSQL setup, ETL pipeline, VPS deploy   |

---

## 10. Lessons Learned

- Separating transactional and reporting databases improves performance
- ETL idempotency (using UPSERT) is critical for data integrity
- JWT stateless auth is more scalable than session-based auth
- systemd is essential for production reliability
- nginx as a reverse proxy simplifies CORS and security
