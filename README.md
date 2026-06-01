# Inventory & Order Management System

A production-ready, clean, and highly responsive **Inventory & Order Management System** built with **FastAPI (Python)** and **React + Vite (JavaScript)**. The project is designed with a strict, minimalist grayscale styling, comprehensive server-side stock and total validations, and is fully containerized using **Docker** and **Docker Compose**.

---

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy ORM, PostgreSQL database, Pydantic (data validation)
- **Frontend**: React.js, Vite, Axios, React Router v6, Vanilla CSS (Mobile Responsive Grid & Typography)
- **Containerization**: Docker, Docker Compose
- **Deployment**: Render (Backend), Vercel (Frontend)

---

## Key Business Logic & Validation Features

1. **SKU Uniqueness**: Products are checked for unique SKUs on creation and modification.
2. **Email Uniqueness**: Customer registry ensures email addresses are strictly unique in the system.
3. **Non-Negative Stocks & Prices**: Products cannot have negative stock numbers or negative unit pricing.
4. **Server-Side Total Calculation**: Total order amounts are calculated strictly on the backend to avoid client manipulation.
5. **Stock Control**: Orders are blocked if stock is insufficient. Placing an order immediately reduces corresponding product stock levels.
6. **Automatic Stock Restoration**: Deleting an order automatically adds back all of its order item quantities to the active product inventory stock.
7. **Clean Custom Error Responses**: All endpoints return standard HTTP codes and a JSON error payload structure in case of validation or database errors:
   ```json
   {
     "success": false,
     "message": "Meaningful error message"
   }
   ```

---

## Folder Structure

```text
inventory-management-system/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── products.py
│   │   │   ├── customers.py
│   │   │   └── orders.py
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   └── Alert.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Customers.jsx
│   │   │   └── Orders.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Environment Variables

A `.env.example` file is included in the project root. Create a `.env` file to configure your local setup:

| Variable Name | Description | Default Value |
| --- | --- | --- |
| `POSTGRES_DB` | Name of the PostgreSQL database | `postgres_db` |
| `POSTGRES_USER` | PostgreSQL user role | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL user password | `postgres` |
| `DATABASE_URL` | SQLAlchemy connection string | `postgresql://postgres:postgres@postgres:5432/postgres_db` |
| `FRONTEND_URL` | Production allowed CORS origin | `*` (Allows all origins in dev) |
| `VITE_API_BASE_URL` | API connection base URL for React | `http://localhost:8000` |

---

## Setup & Running the Project

### Option A: Docker Compose (Recommended)

To build and run all services (frontend, backend, postgres database, and named volumes) instantly, execute:

```bash
# Clone the repository and navigate to the project root
cd inventory-management-system

# Build and launch all containers
docker-compose up --build
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **FastAPI API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **FastAPI API Root Endpoint**: [http://localhost:8000/](http://localhost:8000/)

To stop and remove containers and volumes, run:
```bash
docker-compose down -v
```

---

### Option B: Local Manual Setup (Without Docker)

#### 1. Setup PostgreSQL Database
Ensure you have a PostgreSQL server running locally, create a database named `postgres_db` (or any custom name), and configure your `.env` variables accordingly.

#### 2. Run the Backend API
```bash
cd backend

# Create a virtual environment
python -m venv venv
# Activate virtual environment (Windows)
venv\Scripts\activate
# Activate virtual environment (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend local dev server (default port: 8000)
# Set your DATABASE_URL environment variable first, e.g.
# Windows PowerShell:
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres_db"
# macOS/Linux:
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres_db"

uvicorn app.main:app --reload
```

#### 3. Run the Frontend App
```bash
cd frontend

# Install package dependencies
npm install

# Run the local Vite server (default port: 5173)
npm run dev
```

---

## API Endpoints

### Products API
- `POST /products` - Create a new product (validates unique SKU, non-negative price/stock).
- `GET /products` - Retrieve list of all products in inventory.
- `GET /products/{id}` - Retrieve a single product by ID.
- `PUT /products/{id}` - Update product details (handles unique SKU checks).
- `DELETE /products/{id}` - Delete a product.

### Customers API
- `POST /customers` - Register a new customer (validates unique email, email format, phone format).
- `GET /customers` - Retrieve list of all customers.
- `GET /customers/{id}` - Retrieve a single customer by ID.
- `DELETE /customers/{id}` - Delete a customer (cascades to delete all customer orders).

### Orders API
- `POST /orders` - Create an order (validates customer/product IDs, validates stock levels, reduces stock, and calculates total amount).
- `GET /orders` - Retrieve list of all active orders.
- `GET /orders/{id}` - Retrieve details of an order, including all order items.
- `DELETE /orders/{id}` - Delete an order (restores stock levels for all products in the order).

---

## Deployment Instructions

### 1. Backend Deployment (Render)

1. Create a free account on [Render](https://render.com/).
2. Click **New +** and select **PostgreSQL** to create a PostgreSQL instance.
   - Note the **Internal Database URL** and **External Database URL**.
3. Click **New +** and select **Web Service**.
4. Connect your Git repository.
5. Configure the Web Service:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn -k uvicorn.workers.UvicornWorker backend.app.main:app` (or `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT` is standard too).
6. Set the **Environment Variables** in Render's settings tab:
   - `DATABASE_URL`: Set to the PostgreSQL instance's Connection String (External URL).
   - `FRONTEND_URL`: Set to the deployed Vercel domain URL (e.g. `https://your-app.vercel.app`).
7. Click **Deploy**.

### 2. Frontend Deployment (Vercel)

1. Create a free account on [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Connect your Git repository.
4. Select the project root folder or choose the `frontend` subfolder.
5. In **Build & Development Settings**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
6. Set the **Environment Variables**:
   - `VITE_API_BASE_URL`: The deployed URL of your Render backend API (e.g. `https://your-backend.onrender.com`).
7. Click **Deploy**.
