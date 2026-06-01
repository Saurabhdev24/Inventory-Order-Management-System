import re
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
PHONE_REGEX = re.compile(r"^\+?[0-9\s\-()]{7,20}$")



class ProductBase(BaseModel):
    name: str = Field(..., description="Product name cannot be empty")
    sku: str = Field(..., description="SKU must be unique and non-empty")
    price: Decimal = Field(..., description="Price must be non-negative")
    quantity_in_stock: int = Field(..., description="Quantity in stock cannot be negative")

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Product name cannot be empty")
        return v.strip()

    @field_validator("sku")
    @classmethod
    def sku_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("SKU cannot be empty")
        return v.strip()

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Price cannot be negative")
        return v

    @field_validator("quantity_in_stock")
    @classmethod
    def quantity_must_be_positive(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity in stock cannot be negative")
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True


class CustomerBase(BaseModel):
    full_name: str = Field(..., description="Customer full name cannot be empty")
    email: str = Field(..., description="Customer email must be unique and valid")
    phone: str = Field(..., description="Customer phone number must be valid")

    @field_validator("full_name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Customer name cannot be empty")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        clean_email = v.strip()
        if not EMAIL_REGEX.match(clean_email):
            raise ValueError("Invalid email format")
        return clean_email

    @field_validator("phone")
    @classmethod
    def phone_must_be_valid(cls, v: str) -> str:
        clean_phone = v.strip()
        # Remove common characters to count digits
        digits_only = re.sub(r"[^\d]", "", clean_phone)
        if not PHONE_REGEX.match(clean_phone) or len(digits_only) < 7:
            raise ValueError("Invalid phone number")
        return clean_phone

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True



class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., description="Quantity must be positive")

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be greater than zero")
        return v

class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_price: Decimal

    class Config:
        from_attributes = True



class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., description="Order must contain at least one item")

    @field_validator("items")
    @classmethod
    def items_must_not_be_empty(cls, v: List[OrderItemCreate]) -> List[OrderItemCreate]:
        if not v:
            raise ValueError("Order must contain at least one item")
        return v

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True
