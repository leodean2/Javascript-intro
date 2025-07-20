#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Automares E-Commerce Platform
Tests all backend endpoints for product management, cart operations, and order processing.
"""

import requests
import json
import uuid
import time
from typing import Dict, List, Any

# Configuration
BACKEND_URL = "https://31379383-4c1f-4917-a2aa-2ff6e142dd66.preview.emergentagent.com/api"
SESSION_ID = str(uuid.uuid4())  # Generate unique session for testing

class AutomaresAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session_id = SESSION_ID
        self.test_results = []
        self.created_products = []
        self.created_orders = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_sample_data_initialization(self):
        """Test POST /api/init-sample-data"""
        print("\n=== Testing Sample Data Initialization ===")
        
        try:
            response = requests.post(f"{self.base_url}/init-sample-data")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Sample Data Init", True, f"Status: {response.status_code}, Message: {data.get('message', 'Success')}")
            else:
                self.log_test("Sample Data Init", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Sample Data Init", False, f"Exception: {str(e)}")
    
    def test_get_products(self):
        """Test GET /api/products"""
        print("\n=== Testing Get All Products ===")
        
        try:
            response = requests.get(f"{self.base_url}/products")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list) and len(products) > 0:
                    self.log_test("Get All Products", True, f"Retrieved {len(products)} products")
                    # Store first product for later tests
                    if products:
                        self.created_products = products
                else:
                    self.log_test("Get All Products", False, "No products returned")
            else:
                self.log_test("Get All Products", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get All Products", False, f"Exception: {str(e)}")
    
    def test_get_products_by_category(self):
        """Test GET /api/products?category=Brakes"""
        print("\n=== Testing Get Products by Category ===")
        
        try:
            response = requests.get(f"{self.base_url}/products?category=Brakes")
            
            if response.status_code == 200:
                products = response.json()
                brake_products = [p for p in products if p.get('category') == 'Brakes']
                if len(brake_products) > 0:
                    self.log_test("Get Products by Category", True, f"Found {len(brake_products)} brake products")
                else:
                    self.log_test("Get Products by Category", True, "No brake products found (acceptable)")
            else:
                self.log_test("Get Products by Category", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Products by Category", False, f"Exception: {str(e)}")
    
    def test_get_categories(self):
        """Test GET /api/categories"""
        print("\n=== Testing Get Categories ===")
        
        try:
            response = requests.get(f"{self.base_url}/categories")
            
            if response.status_code == 200:
                data = response.json()
                categories = data.get('categories', [])
                if len(categories) > 0:
                    self.log_test("Get Categories", True, f"Found categories: {categories}")
                else:
                    self.log_test("Get Categories", True, "No categories found (acceptable)")
            else:
                self.log_test("Get Categories", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Categories", False, f"Exception: {str(e)}")
    
    def test_get_single_product(self):
        """Test GET /api/products/{product_id}"""
        print("\n=== Testing Get Single Product ===")
        
        if not self.created_products:
            self.log_test("Get Single Product", False, "No products available for testing")
            return
            
        try:
            product_id = self.created_products[0]['id']
            response = requests.get(f"{self.base_url}/products/{product_id}")
            
            if response.status_code == 200:
                product = response.json()
                if product.get('id') == product_id:
                    self.log_test("Get Single Product", True, f"Retrieved product: {product.get('name')}")
                else:
                    self.log_test("Get Single Product", False, "Product ID mismatch")
            else:
                self.log_test("Get Single Product", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Single Product", False, f"Exception: {str(e)}")
    
    def test_add_to_cart(self):
        """Test POST /api/cart/add"""
        print("\n=== Testing Add Item to Cart ===")
        
        if not self.created_products:
            self.log_test("Add to Cart", False, "No products available for testing")
            return
            
        try:
            product = self.created_products[0]
            payload = {
                "session_id": self.session_id,
                "product_id": product['id'],
                "quantity": 2
            }
            
            response = requests.post(f"{self.base_url}/cart/add", params=payload)
            
            if response.status_code == 200:
                data = response.json()
                cart = data.get('cart', {})
                if len(cart.get('items', [])) > 0:
                    self.log_test("Add to Cart", True, f"Added {product['name']} to cart")
                else:
                    self.log_test("Add to Cart", False, "Cart is empty after adding item")
            else:
                self.log_test("Add to Cart", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Add to Cart", False, f"Exception: {str(e)}")
    
    def test_get_cart(self):
        """Test GET /api/cart/{session_id}"""
        print("\n=== Testing Get Cart ===")
        
        try:
            response = requests.get(f"{self.base_url}/cart/{self.session_id}")
            
            if response.status_code == 200:
                cart = response.json()
                items = cart.get('items', [])
                total = cart.get('total_amount', 0)
                self.log_test("Get Cart", True, f"Cart has {len(items)} items, total: ${total}")
            else:
                self.log_test("Get Cart", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Cart", False, f"Exception: {str(e)}")
    
    def test_update_cart_quantity(self):
        """Test POST /api/cart/update"""
        print("\n=== Testing Update Cart Quantity ===")
        
        if not self.created_products:
            self.log_test("Update Cart Quantity", False, "No products available for testing")
            return
            
        try:
            product_id = self.created_products[0]['id']
            payload = {
                "session_id": self.session_id,
                "product_id": product_id,
                "quantity": 3
            }
            
            response = requests.post(f"{self.base_url}/cart/update", params=payload)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Update Cart Quantity", True, "Cart quantity updated successfully")
            else:
                self.log_test("Update Cart Quantity", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Update Cart Quantity", False, f"Exception: {str(e)}")
    
    def test_add_multiple_items_to_cart(self):
        """Add multiple different items to cart for order testing"""
        print("\n=== Adding Multiple Items to Cart ===")
        
        if len(self.created_products) < 2:
            self.log_test("Add Multiple Items", False, "Need at least 2 products for testing")
            return
            
        try:
            # Add second product to cart
            product = self.created_products[1]
            payload = {
                "session_id": self.session_id,
                "product_id": product['id'],
                "quantity": 1
            }
            
            response = requests.post(f"{self.base_url}/cart/add", params=payload)
            
            if response.status_code == 200:
                self.log_test("Add Multiple Items", True, f"Added {product['name']} to cart")
            else:
                self.log_test("Add Multiple Items", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Add Multiple Items", False, f"Exception: {str(e)}")
    
    def test_create_order(self):
        """Test POST /api/orders"""
        print("\n=== Testing Create Order ===")
        
        try:
            order_data = {
                "customer_name": "John Smith",
                "customer_email": "john.smith@email.com",
                "customer_phone": "+1-555-0123",
                "customer_address": "123 Main Street, Automotive City, AC 12345",
                "cart_session_id": self.session_id
            }
            
            response = requests.post(f"{self.base_url}/orders", json=order_data)
            
            if response.status_code == 200:
                order = response.json()
                order_id = order.get('id')
                total = order.get('total_amount', 0)
                items_count = len(order.get('items', []))
                
                if order_id:
                    self.created_orders.append(order)
                    self.log_test("Create Order", True, f"Order created: {order_id}, {items_count} items, total: ${total}")
                else:
                    self.log_test("Create Order", False, "No order ID returned")
            else:
                self.log_test("Create Order", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Create Order", False, f"Exception: {str(e)}")
    
    def test_get_orders(self):
        """Test GET /api/orders"""
        print("\n=== Testing Get Orders ===")
        
        try:
            response = requests.get(f"{self.base_url}/orders")
            
            if response.status_code == 200:
                orders = response.json()
                if isinstance(orders, list):
                    self.log_test("Get Orders", True, f"Retrieved {len(orders)} orders")
                else:
                    self.log_test("Get Orders", False, "Invalid response format")
            else:
                self.log_test("Get Orders", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Orders", False, f"Exception: {str(e)}")
    
    def test_get_single_order(self):
        """Test GET /api/orders/{order_id}"""
        print("\n=== Testing Get Single Order ===")
        
        if not self.created_orders:
            self.log_test("Get Single Order", False, "No orders available for testing")
            return
            
        try:
            order_id = self.created_orders[0]['id']
            response = requests.get(f"{self.base_url}/orders/{order_id}")
            
            if response.status_code == 200:
                order = response.json()
                if order.get('id') == order_id:
                    self.log_test("Get Single Order", True, f"Retrieved order: {order_id}")
                else:
                    self.log_test("Get Single Order", False, "Order ID mismatch")
            else:
                self.log_test("Get Single Order", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Single Order", False, f"Exception: {str(e)}")
    
    def test_update_order_status(self):
        """Test PUT /api/orders/{order_id}/status"""
        print("\n=== Testing Update Order Status ===")
        
        if not self.created_orders:
            self.log_test("Update Order Status", False, "No orders available for testing")
            return
            
        try:
            order_id = self.created_orders[0]['id']
            payload = {"status": "confirmed"}
            
            response = requests.put(f"{self.base_url}/orders/{order_id}/status", params=payload)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Update Order Status", True, f"Order status updated: {data.get('message')}")
            else:
                self.log_test("Update Order Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Update Order Status", False, f"Exception: {str(e)}")
    
    def test_cart_cleared_after_order(self):
        """Test that cart is cleared after successful order"""
        print("\n=== Testing Cart Cleared After Order ===")
        
        try:
            response = requests.get(f"{self.base_url}/cart/{self.session_id}")
            
            if response.status_code == 200:
                cart = response.json()
                items = cart.get('items', [])
                if len(items) == 0:
                    self.log_test("Cart Cleared After Order", True, "Cart successfully cleared after order")
                else:
                    self.log_test("Cart Cleared After Order", False, f"Cart still has {len(items)} items")
            else:
                self.log_test("Cart Cleared After Order", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Cart Cleared After Order", False, f"Exception: {str(e)}")
    
    def test_remove_from_cart(self):
        """Test POST /api/cart/remove"""
        print("\n=== Testing Remove Item from Cart ===")
        
        # First add an item to test removal
        if not self.created_products:
            self.log_test("Remove from Cart", False, "No products available for testing")
            return
            
        try:
            # Add item first
            product = self.created_products[0]
            add_payload = {
                "session_id": self.session_id,
                "product_id": product['id'],
                "quantity": 1
            }
            requests.post(f"{self.base_url}/cart/add", params=add_payload)
            
            # Now remove it
            remove_payload = {
                "session_id": self.session_id,
                "product_id": product['id']
            }
            
            response = requests.post(f"{self.base_url}/cart/remove", params=remove_payload)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Remove from Cart", True, "Item removed from cart successfully")
            else:
                self.log_test("Remove from Cart", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Remove from Cart", False, f"Exception: {str(e)}")
    
    def test_error_cases(self):
        """Test various error scenarios"""
        print("\n=== Testing Error Cases ===")
        
        # Test invalid product ID
        try:
            response = requests.get(f"{self.base_url}/products/invalid-id")
            if response.status_code == 404:
                self.log_test("Invalid Product ID", True, "Correctly returned 404 for invalid product")
            else:
                self.log_test("Invalid Product ID", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Invalid Product ID", False, f"Exception: {str(e)}")
        
        # Test empty cart checkout
        try:
            empty_session = str(uuid.uuid4())
            order_data = {
                "customer_name": "Test User",
                "customer_email": "test@email.com",
                "customer_phone": "+1-555-0000",
                "customer_address": "Test Address",
                "cart_session_id": empty_session
            }
            
            response = requests.post(f"{self.base_url}/orders", json=order_data)
            if response.status_code == 400:
                self.log_test("Empty Cart Checkout", True, "Correctly prevented empty cart checkout")
            else:
                self.log_test("Empty Cart Checkout", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Empty Cart Checkout", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Automares E-Commerce Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print(f"Test Session ID: {self.session_id}")
        
        # Priority 1 - Core Product Management
        self.test_sample_data_initialization()
        time.sleep(1)  # Brief pause between tests
        
        self.test_get_products()
        self.test_get_products_by_category()
        self.test_get_categories()
        self.test_get_single_product()
        
        # Priority 2 - Shopping Cart Management
        self.test_add_to_cart()
        self.test_get_cart()
        self.test_update_cart_quantity()
        self.test_add_multiple_items_to_cart()
        self.test_remove_from_cart()
        
        # Priority 3 - Order Processing
        # Re-add items for order testing since we removed them
        if self.created_products:
            for i, product in enumerate(self.created_products[:2]):
                payload = {
                    "session_id": self.session_id,
                    "product_id": product['id'],
                    "quantity": 1 + i
                }
                requests.post(f"{self.base_url}/cart/add", params=payload)
        
        self.test_create_order()
        self.test_get_orders()
        self.test_get_single_order()
        self.test_update_order_status()
        self.test_cart_cleared_after_order()
        
        # Additional Tests
        self.test_error_cases()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🏁 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n" + "="*60)

if __name__ == "__main__":
    tester = AutomaresAPITester()
    tester.run_all_tests()