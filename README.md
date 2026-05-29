#  ShopEase — Full-Stack E-Commerce System

> A complete, production-ready e-commerce application built as a Final Project.
> Live and deployed on a cloud VPS — accessible from anywhere in the world.

---

##  Live Application

| Page | URL |
|---|---|
|  Homepage | http://72.60.232.167 |
|  Products | http://72.60.232.167/products |
|  Admin Dashboard | http://72.60.232.167/admin |
|  Reports Dashboard | http://72.60.232.167/admin/reports |
|  API Documentation | http://72.60.232.167/docs |

---

##  Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@shopease.com | admin123 |
| Customer | customer@example.com | customer123 |

---

##  What is ShopEase?

ShopEase is a fully functional online shopping platform where customers can browse
products, add items to their cart, place orders, and track their purchases.
Store administrators can manage the entire catalog, monitor orders, and view
detailed business analytics through a dedicated reporting dashboard.

The system uses **two separate PostgreSQL databases** — one for live transactions
and one dedicated to analytics — connected by an automated ETL pipeline that
runs every 15 minutes in the background.

---

##  Features

### For Customers
-  Browse and search products by name or category
-  Add items to cart with quantity management
-  Place orders with shipping address
-  Track order status (Pending → Processing → Shipped → Delivered)
-  Register and login with secure JWT authentication

### For Administrators
-  Manage products — add, edit, delete
-  View and update all customer orders
-  View all registered users
-  Full reporting dashboard with live charts:
  - Total revenue and order counts
  - Revenue over the last 30 days (line chart)
  - Orders over the last 30 days (bar chart)
  - Sales breakdown by category (pie chart)
  - Top products by revenue (bar chart)
  - Top customers by spending (table)

---

##  System Architecture

```
User's Browser
      |
      ▼  Port 80
   nginx (Web Server)
      |
      ├── /            →  React Frontend (HTML/CSS/JS)
      |
      └── /api/        →  FastAPI Backend (Port 8000)
                               |
                    +----------+----------+
                    |                     |
             PostgreSQL              PostgreSQL
            (shopdb)               (shopreporting)
            Main Database          Reporting Database
            [users, products,      [daily_sales,
             orders, items]         top_products,
                    |               customers,
                    |               categories]
                    |                     ▲
                    └──── ETL Pipeline ───┘
                         (every 15 min)
```

---

##  Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | User interface |
| Styling | TailwindCSS | Modern responsive design |
| Charts | Recharts | Analytics visualizations |
| State | Zustand | Cart and auth state management |
| Backend | FastAPI (Python) | REST API server |
| Auth | JWT Tokens | Secure stateless authentication |
| Passwords | bcrypt | One-way password hashing |
| ORM | SQLAlchemy | Database object mapping |
| Main DB | PostgreSQL | Transactional data storage |
| Report DB | PostgreSQL | Analytics data storage |
| ETL | Python scripts | Data extraction and transformation |
| Scheduler | Linux cron | Automated ETL every 15 minutes |
| Web Server | nginx | Reverse proxy + static files |
| Process Mgr | systemd | Auto-restart backend on crash/reboot |
| Hosting | Ubuntu VPS (Hostinger) | Cloud deployment |

---

##  Database Design

### Main Database — `shopdb`
Stores all live transactional data:
- **users** — customer and admin accounts
- **products** — product catalog with stock levels
- **orders** — customer orders with status tracking
- **order_items** — individual line items within each order

### Reporting Database — `shopreporting`
Stores pre-aggregated analytics data for fast dashboard reads:
- **daily_sales_summary** — revenue and order counts per day
- **product_sales_summary** — total units sold and revenue per product
- **customer_summary** — total orders and spending per customer
- **category_sales_summary** — revenue breakdown by product category
- **etl_log** — audit trail of every ETL pipeline run

---

##  ETL Pipeline

The ETL (Extract → Transform → Load) pipeline is a Python script that:

1. **Extracts** raw order data from the main `shopdb` database
2. **Transforms** it into meaningful summaries (totals, averages, rankings)
3. **Loads** the results into `shopreporting` using UPSERT — safe to run multiple times without creating duplicate data
4. **Logs** every run with timestamp and record count
5. **Runs automatically** every 15 minutes via Linux cron job

---

##  Project Structure

```
ShopEase/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── requirements.txt      # Python dependencies
│   ├── seed_data.py          # Database seeder with sample data
│   ├── core/
│   │   ├── database.py       # DB connections (main + reporting)
│   │   └── security.py       # JWT auth, password hashing
│   ├── models/               # SQLAlchemy database table definitions
│   ├── schemas/              # Pydantic request/response validators
│   ├── routers/              # API endpoint handlers
│   │   ├── auth.py           # Login, register
│   │   ├── products.py       # Product CRUD
│   │   ├── orders.py         # Order processing
│   │   ├── users.py          # User management
│   │   └── analytics.py      # Reporting endpoints
│   └── etl/
│       ├── etl_pipeline.py   # Main ETL script
│       └── run_etl.sh        # Shell wrapper for cron
├── frontend/
│   └── src/
│       ├── pages/            # All page components
│       ├── components/       # Reusable UI components
│       ├── store/            # Zustand state (auth + cart)
│       └── services/         # Axios API client
├── nginx/
│   └── shopease.conf         # nginx reverse proxy config
├── systemd/
│   └── shopease.service      # systemd auto-restart service
└── docs/
    ├── DEPLOYMENT_GUIDE.md   # Full VPS deployment tutorial
    └── DOCUMENTATION.md      # Technical documentation
```

---

##  Security Features

- Passwords hashed with **bcrypt** — never stored in plain text
- **JWT tokens** expire after 60 minutes
- Admin-only endpoints protected by **role-based middleware**
- nginx security headers (X-Frame-Options, X-Content-Type-Options)
- PostgreSQL users have minimum required permissions only

---

*Final Project — Full-Stack E-Commerce System with ETL Pipeline and Analytics Dashboard*
