# Inventory & Order Management System

A full-stack inventory and order management system built with FastAPI, React, and PostgreSQL.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React, Vite, Axios, React Router
- **Containerization**: Docker, Docker Compose
- **Deployment**: Render (Backend), Vercel (Frontend)

## Project Structure

inventory-management-system/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── schemas.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       └── services/
├── docker-compose.yml
└── .env.example


## Run with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## API Endpoints

### Products
- `POST /products` - Create product
- `GET /products` - Get all products
- `GET /products/{id}` - Get product by ID
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### Customers
- `POST /customers` - Create customer
- `GET /customers` - Get all customers
- `GET /customers/{id}` - Get customer by ID
- `DELETE /customers/{id}` - Delete customer

### Orders
- `POST /orders` - Create order
- `GET /orders` - Get all orders
- `GET /orders/{id}` - Get order by ID
- `DELETE /orders/{id}` - Delete order

## Deployment

- Backend deployed on **Render**
- Frontend deployed on **Vercel**   

## Links
- backend links - https://inventory-order-management-system-eeuw.onrender.com/docs
                - https://inventory-order-management-system-eeuw.onrender.com/
- final deployed Link - https://inventory-order-management-system-olive.vercel.app/ 