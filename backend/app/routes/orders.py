from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter()

def format_order_response(order: models.Order) -> dict:
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.full_name if order.customer else "Unknown Customer",
        "total_amount": order.total_amount,
        "created_at": order.created_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "Deleted Product",
                "product_sku": item.product.sku if item.product else "N/A",
                "quantity": item.quantity,
                "unit_price": item.unit_price
            } for item in order.items
        ]
    }

@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    total_amount = 0
    items_to_create = []
    products_to_update = []
    
    for item in order_in.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found"
            )
        
        if product.quantity_in_stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product: {product.name} (Available: {product.quantity_in_stock}, Requested: {item.quantity})"
            )
        
        item_total = product.price * item.quantity
        total_amount += item_total
        
        items_to_create.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "unit_price": product.price
        })
        
        products_to_update.append((product, item.quantity))
        
    try:
        db_order = models.Order(
            customer_id=order_in.customer_id,
            total_amount=total_amount
        )
        db.add(db_order)
        db.flush()  
        
        for item_data in items_to_create:
            db_item = models.OrderItem(
                order_id=db_order.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"]
            )
            db.add(db_item)
            
        for product, qty in products_to_update:
            product.quantity_in_stock -= qty
            
        db.commit()
        db.refresh(db_order)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error placing order: {str(e)}"
        )
        
    return format_order_response(db_order)

@router.get("/", response_model=List[schemas.OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    return [format_order_response(order) for order in orders]

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return format_order_response(order)

@router.delete("/{order_id}", status_code=status.HTTP_200_OK)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    try:
        for item in order.items:
            if item.product:
                item.product.quantity_in_stock += item.quantity
                
        db.delete(order)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting order: {str(e)}"
        )
        
    return {"success": True, "message": "Order deleted successfully"}
