from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    stock_quantity: int
    image_base64: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    stock_quantity: int
    image_base64: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    stock_quantity: Optional[int] = None
    image_base64: Optional[str] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    product_name: str
    product_price: float
    product_image: Optional[str] = None

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    items: List[CartItem] = []
    total_amount: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    subtotal: float

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: str
    customer_phone: str
    customer_address: str
    items: List[OrderItem]
    total_amount: float
    status: str = "pending"  # pending, confirmed, processing, shipped, delivered, cancelled
    payment_status: str = "pending"  # pending, paid, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    customer_address: str
    cart_session_id: str

# Product endpoints
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, limit: int = 50):
    filter_dict = {}
    if category:
        filter_dict["category"] = category
    
    products = await db.products.find(filter_dict).limit(limit).to_list(limit)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductUpdate):
    # Check if product exists
    existing_product = await db.products.find_one({"id": product_id})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields
    update_dict = {k: v for k, v in product_update.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.products.update_one({"id": product_id}, {"$set": update_dict})
    
    # Return updated product
    updated_product = await db.products.find_one({"id": product_id})
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.get("/categories")
async def get_categories():
    categories = await db.products.distinct("category")
    return {"categories": categories}

# Cart endpoints
@api_router.post("/cart/add")
async def add_to_cart(session_id: str, product_id: str, quantity: int = 1):
    # Get product details
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check stock
    if product["stock_quantity"] < quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Find or create cart
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        cart = Cart(session_id=session_id, items=[])
        cart = cart.dict()
    
    # Check if product already in cart
    existing_item_index = None
    for i, item in enumerate(cart["items"]):
        if item["product_id"] == product_id:
            existing_item_index = i
            break
    
    if existing_item_index is not None:
        # Update quantity
        cart["items"][existing_item_index]["quantity"] += quantity
    else:
        # Add new item
        cart_item = CartItem(
            product_id=product_id,
            quantity=quantity,
            product_name=product["name"],
            product_price=product["price"],
            product_image=product.get("image_base64")
        )
        cart["items"].append(cart_item.dict())
    
    # Calculate total
    total = sum(item["quantity"] * item["product_price"] for item in cart["items"])
    cart["total_amount"] = total
    cart["updated_at"] = datetime.utcnow()
    
    # Save cart
    await db.carts.replace_one({"session_id": session_id}, cart, upsert=True)
    
    return {"message": "Item added to cart", "cart": cart}

@api_router.get("/cart/{session_id}")
async def get_cart(session_id: str):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        return {"items": [], "total_amount": 0}
    return cart

@api_router.post("/cart/remove")
async def remove_from_cart(session_id: str, product_id: str):
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Remove item
    cart["items"] = [item for item in cart["items"] if item["product_id"] != product_id]
    
    # Recalculate total
    total = sum(item["quantity"] * item["product_price"] for item in cart["items"])
    cart["total_amount"] = total
    cart["updated_at"] = datetime.utcnow()
    
    await db.carts.replace_one({"session_id": session_id}, cart)
    return {"message": "Item removed from cart", "cart": cart}

@api_router.post("/cart/update")
async def update_cart_item(session_id: str, product_id: str, quantity: int):
    if quantity <= 0:
        return await remove_from_cart(session_id, product_id)
    
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Check stock
    product = await db.products.find_one({"id": product_id})
    if product and product["stock_quantity"] < quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Update quantity
    for item in cart["items"]:
        if item["product_id"] == product_id:
            item["quantity"] = quantity
            break
    
    # Recalculate total
    total = sum(item["quantity"] * item["product_price"] for item in cart["items"])
    cart["total_amount"] = total
    cart["updated_at"] = datetime.utcnow()
    
    await db.carts.replace_one({"session_id": session_id}, cart)
    return {"message": "Cart updated", "cart": cart}

# Order endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Get cart
    cart = await db.carts.find_one({"session_id": order_data.cart_session_id})
    if not cart or not cart["items"]:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Create order items
    order_items = []
    total_amount = 0
    
    for cart_item in cart["items"]:
        # Check stock again
        product = await db.products.find_one({"id": cart_item["product_id"]})
        if not product or product["stock_quantity"] < cart_item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {cart_item['product_name']}")
        
        subtotal = cart_item["quantity"] * cart_item["product_price"]
        order_item = OrderItem(
            product_id=cart_item["product_id"],
            product_name=cart_item["product_name"],
            quantity=cart_item["quantity"],
            price=cart_item["product_price"],
            subtotal=subtotal
        )
        order_items.append(order_item)
        total_amount += subtotal
        
        # Update stock
        await db.products.update_one(
            {"id": cart_item["product_id"]}, 
            {"$inc": {"stock_quantity": -cart_item["quantity"]}}
        )
    
    # Create order
    order = Order(
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        customer_address=order_data.customer_address,
        items=[item.dict() for item in order_items],
        total_amount=total_amount
    )
    
    await db.orders.insert_one(order.dict())
    
    # Clear cart
    await db.carts.delete_one({"session_id": order_data.cart_session_id})
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(limit: int = 100):
    orders = await db.orders.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"id": order_id}, 
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# Initialize with sample products
@api_router.post("/init-sample-data")
async def init_sample_data():
    # Check if products already exist
    existing_products = await db.products.count_documents({})
    if existing_products > 0:
        return {"message": "Sample data already exists"}
    
    sample_products = [
        {
            "name": "Premium Brake Pads Set",
            "description": "High-performance ceramic brake pads for enhanced stopping power and durability. Compatible with most vehicle models.",
            "price": 89.99,
            "category": "Brakes",
            "stock_quantity": 25,
            "image_base64": "https://images.pexels.com/photos/3642618/pexels-photo-3642618.jpeg"
        },
        {
            "name": "Heavy Duty Car Battery",
            "description": "Long-lasting 12V car battery with 3-year warranty. Perfect for all weather conditions.",
            "price": 129.99,
            "category": "Electrical",
            "stock_quantity": 15,
            "image_base64": "https://images.pexels.com/photos/4374843/pexels-photo-4374843.jpeg"
        },
        {
            "name": "High-Performance Air Filter",
            "description": "Premium air filter for improved engine performance and fuel efficiency.",
            "price": 34.99,
            "category": "Engine",
            "stock_quantity": 40,
            "image_base64": "https://images.unsplash.com/photo-1663642775693-6628f65358be"
        },
        {
            "name": "Engine Oil 5W-30",
            "description": "Synthetic motor oil for optimal engine protection and performance.",
            "price": 45.99,
            "category": "Engine",
            "stock_quantity": 30,
            "image_base64": "https://images.pexels.com/photos/7565172/pexels-photo-7565172.jpeg"
        },
        {
            "name": "Alloy Wheel Set",
            "description": "Lightweight alloy wheels for enhanced performance and style.",
            "price": 299.99,
            "category": "Wheels",
            "stock_quantity": 8,
            "image_base64": "https://images.pexels.com/photos/9846151/pexels-photo-9846151.jpeg"
        },
        {
            "name": "Spark Plugs Set (4-pack)",
            "description": "Iridium spark plugs for reliable ignition and improved fuel economy.",
            "price": 29.99,
            "category": "Engine",
            "stock_quantity": 50,
            "image_base64": "https://images.pexels.com/photos/3642618/pexels-photo-3642618.jpeg"
        }
    ]
    
    for product_data in sample_products:
        product = Product(**product_data)
        await db.products.insert_one(product.dict())
    
    return {"message": "Sample data initialized successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()