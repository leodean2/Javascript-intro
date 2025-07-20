import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./App.css";
import axios from "axios";
import Admin from "./Admin";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";

const API = `http://localhost:5001/api`;

// Generate a session ID for the cart
const getSessionId = () => {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

// Header Component
const Header = ({ cartItemsCount, onCartClick, onHomeClick }) => {
  return (
    <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onHomeClick}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold">A</span>
            </div>
            <h1 className="text-2xl font-bold">Automares</h1>
          </div>
          <nav className="flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-400 transition-colors">
              Home
            </Link>
            <Link to="/admin" className="hover:text-blue-400 transition-colors">
              Admin
            </Link>
            <Link to="/login" className="hover:text-blue-400 transition-colors">
              Login
            </Link>
            <Link to="/register" className="hover:text-blue-400 transition-colors">
              Register
            </Link>
            <Link to="/profile" className="hover:text-blue-400 transition-colors">
              Profile
            </Link>
            <button
              onClick={onCartClick}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <span>Cart ({cartItemsCount})</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <div className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-700 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <img 
        src="https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxjYXIlMjBwYXJ0c3xlbnwwfHx8fDE3NTI5MzczNzV8MA&ixlib=rb-4.1.0&q=85"
        alt="Auto Parts"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 text-center text-white px-4">
        <h2 className="text-5xl font-bold mb-4">Premium Auto Parts</h2>
        <p className="text-xl mb-6 max-w-2xl mx-auto">
          Quality automotive parts and accessories for all your vehicle needs. 
          Located in Kirinyaga Road, Nairobi.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
          Shop Now
        </button>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    await onAddToCart(product);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="h-48 bg-gray-200 overflow-hidden">
        <img 
          src={product.image_base64} 
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-blue-600">KES {product.price}</span>
          <span className="text-sm text-gray-500">Stock: {product.stock_quantity}</span>
        </div>
        <button 
          onClick={handleAddToCart}
          disabled={isLoading || product.stock_quantity === 0}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
            product.stock_quantity === 0 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Adding...' : product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

// Cart Component
const CartView = ({ cart, onUpdateQuantity, onRemoveItem, onCheckout, onBackToHome, onMpesaCheckout }) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [showCheckout, setShowCheckout] = useState(false);

  const handleInputChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    });
  };

  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      alert('Please fill in all required fields');
      return;
    }
    await onCheckout(customerInfo);
  };

  const handleMpesaCheckout = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      alert('Please fill in all required fields');
      return;
    }
    if (!mpesaPhoneNumber) {
      alert('Please enter your M-Pesa phone number');
      return;
    }
    await onMpesaCheckout(customerInfo, mpesaPhoneNumber);
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Your Cart</h2>
            <div className="bg-white rounded-lg shadow p-8">
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <p className="text-gray-600 mb-6">Your cart is empty</p>
              <button 
                onClick={onBackToHome}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Your Cart</h2>
            <button 
              onClick={onBackToHome}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              ← Continue Shopping
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div key={item.product_id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.product_image} 
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.product_name}</h4>
                      <p className="text-gray-600">KES {item.product_price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">KES {(item.quantity * item.product_price).toFixed(2)}</p>
                      <button 
                        onClick={() => onRemoveItem(item.product_id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6 h-fit">
              <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>KES {cart.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>KES 200.00</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>KES {(cart.total_amount + 200).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {!showCheckout ? (
                <button 
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-semibold">Customer Information</h4>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={customerInfo.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={customerInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                  <textarea
                    name="address"
                    placeholder="Delivery Address"
                    value={customerInfo.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg h-20"
                    required
                  />
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
                  >
                    Place Order
                  </button>
                  <div className="mt-4">
                    <input
                      type="tel"
                      placeholder="M-Pesa Phone Number"
                      value={mpesaPhoneNumber}
                      onChange={(e) => setMpesaPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg mb-2"
                    />
                    <button
                      onClick={handleMpesaCheckout}
                      className="w-full bg-green-800 hover:bg-green-900 text-white py-3 rounded-lg font-semibold"
                    >
                      Pay with M-Pesa
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowCheckout(false)}
                    className="w-full border border-gray-300 hover:bg-gray-50 py-2 rounded-lg"
                  >
                    Back to Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Order Confirmation Component
const OrderConfirmation = ({ order, onBackToHome }) => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">Order Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your order. We'll process it shortly and send you updates.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-left space-y-2">
                <div><strong>Order ID:</strong> {order.id}</div>
                <div><strong>Customer:</strong> {order.customer_name}</div>
                <div><strong>Email:</strong> {order.customer_email}</div>
                <div><strong>Phone:</strong> {order.customer_phone}</div>
                <div><strong>Total:</strong> KES {order.total_amount.toFixed(2)}</div>
                <div><strong>Status:</strong> {order.status}</div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={onBackToHome}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
              >
                Continue Shopping
              </button>
              <p className="text-sm text-gray-500">
                We'll send order updates to your email address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [view, setView] = useState('home'); // 'home', 'cart', 'order-confirmation'
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total_amount: 0 });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  const sessionId = getSessionId();

  useEffect(() => {
    initializeData();
    loadCart();
  }, []);

  const initializeData = async () => {
    try {
      // Initialize sample data
      await axios.post(`${API}/init-sample-data`);
      
      // Load products and categories
      await Promise.all([
        loadProducts(),
        loadCategories()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API}/products${selectedCategory ? `?category=${selectedCategory}` : ''}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(['All', ...response.data.categories]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCart = async () => {
    try {
      const response = await axios.get(`${API}/cart/${sessionId}`);
      setCart(response.data);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const addToCart = async (product) => {
    try {
      const response = await axios.post(`${API}/cart/add`, null, {
        params: {
          session_id: sessionId,
          product_id: product.id,
          quantity: 1
        }
      });
      setCart(response.data.cart);
      // Show success feedback
      alert(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart');
    }
  };

  const updateCartQuantity = async (productId, quantity) => {
    try {
      const response = await axios.post(`${API}/cart/update`, null, {
        params: {
          session_id: sessionId,
          product_id: productId,
          quantity: quantity
        }
      });
      setCart(response.data.cart);
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await axios.post(`${API}/cart/remove`, null, {
        params: {
          session_id: sessionId,
          product_id: productId
        }
      });
      setCart(response.data.cart);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const checkout = async (customerInfo) => {
    try {
      const orderData = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        cart_session_id: sessionId
      };

      const response = await axios.post(`${API}/orders`, orderData);
      setOrder(response.data);
      setCart({ items: [], total_amount: 0 });
      setView('order-confirmation');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  const mpesaCheckout = async (customerInfo, mpesaPhoneNumber) => {
    try {
      // 1. Create Order
      const orderData = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        cart_session_id: sessionId
      };
      const orderResponse = await axios.post(`${API}/orders`, orderData);
      const newOrder = orderResponse.data;
      setOrder(newOrder);

      // 2. Initiate STK Push
      await axios.post(`${API}/mpesa/stk-push`, null, {
        params: {
          order_id: newOrder.id,
          phone_number: mpesaPhoneNumber
        }
      });

      alert('STK push initiated. Please check your phone to complete the payment.');
      setCart({ items: [], total_amount: 0 });
      setView('order-confirmation');

    } catch (error) {
      console.error('Error with M-Pesa checkout:', error);
      alert('Error with M-Pesa checkout. Please try again.');
    }
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === 'All' ? '' : category);
  };

  useEffect(() => {
    if (!loading) {
      loadProducts();
    }
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Automares...</p>
        </div>
      </div>
    );
  }

  const getCartItemsCount = () => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header
          cartItemsCount={getCartItemsCount()}
          onCartClick={() => setView('cart')}
          onHomeClick={() => setView('home')}
        />

        <Routes>
          <Route path="/" element={
            <>
              <HeroSection />

              {/* Categories Filter */}
              <div className="container mx-auto px-4 py-8">
                <div className="flex flex-wrap gap-3 mb-8">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryFilter(category)}
                      className={`px-4 py-2 rounded-full transition-colors ${
                        (category === 'All' && !selectedCategory) || category === selectedCategory
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              </div>
            </>
          } />
          <Route path="/admin" element={<Admin />} />
          <Route path="/cart" element={
            <CartView
              cart={cart}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={checkout}
              onMpesaCheckout={mpesaCheckout}
              onBackToHome={() => setView('home')}
            />
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/order-confirmation" element={
            <OrderConfirmation
              order={order}
              onBackToHome={() => setView('home')}
            />
          } />
        </Routes>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold mb-4">Automares</h3>
            <p className="text-gray-400 mb-4">
              Quality auto parts delivered to your doorstep
            </p>
            <p className="text-gray-500">
              📍 Kirinyaga Road, Nairobi | 📞 Contact us for inquiries
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;