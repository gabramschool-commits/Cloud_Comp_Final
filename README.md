#  ShopEase — Full-Stack E-Commerce System

A complete, production-ready e-commerce application with React frontend,
FastAPI backend, PostgreSQL databases, automated ETL, and analytics dashboard.

---

##  Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL installed locally

### 1. Clone / Download the project
```bash
git clone https://github.com/YOUR_USERNAME/shopease.git
cd shopease
```

### 2. Set up Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# Create DB tables and seed sample data
python seed_data.py

# Start backend
uvicorn main:app --reload --port 8000
```
Backend API is now at: http://localhost:8000
API docs: http://localhost:8000/docs

### 3. Set up Frontend
```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Create .env
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8000

# Start frontend dev server
npm run dev
```
Frontend is now at: http://localhost:5173

### 4. Run ETL
```bash
cd backend
source venv/bin/activate
python etl/etl_pipeline.py
```

---

##  Demo Accounts
| Role     | Email                    | Password     |
|----------|--------------------------|--------------|
| Admin    | admin@shopease.com       | admin123     |
| Customer | customer@example.com     | customer123  |

---

##  Features
-  Product browsing, search, filtering by category
-  Shopping cart with quantity management
-  User registration and login (JWT)
-  Order placement and tracking
-  Admin dashboard (manage products, orders, users)
-  Reporting dashboard (charts: revenue, orders, top products, customers)
-  Automated ETL pipeline (cron every 15 min)
-  Separate reporting database for analytics

---


##  Project Structure
```
Cloud_Comp_Final/
├── backend/          # FastAPI Python backend
├── frontend/         # React + Vite frontend
├── nginx/            # nginx server config
├── systemd/          # systemd service file
└── docs/             # Deployment guide + documentation
```
