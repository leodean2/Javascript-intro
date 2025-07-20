import React, { useState, useEffect } from "react";
import axios from "axios";

const API = `http://localhost:5001/api`;

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock_quantity: "",
    image_base64: "",
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const addProduct = async () => {
    try {
      await axios.post(`${API}/products`, {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock_quantity: parseInt(newProduct.stock_quantity),
      });
      loadProducts();
      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        stock_quantity: "",
        image_base64: "",
      });
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await axios.delete(`${API}/products/${productId}`);
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      await axios.put(`${API}/orders/${selectedOrder.id}/status`, null, {
        params: { status: newStatus },
      });
      loadOrders();
      setSelectedOrder(null);
      setNewStatus("");
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Products</h2>
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2">Add Product</h3>
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                placeholder="Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="p-2 border rounded"
              />
              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newNewProduct, description: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Stock Quantity"
                value={newProduct.stock_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={newProduct.image_base64}
                onChange={(e) => setNewProduct({ ...newProduct, image_base64: e.target.value })}
                className="p-2 border rounded"
              />
              <button onClick={addProduct} className="p-2 bg-blue-500 text-white rounded">
                Add Product
              </button>
            </div>
          </div>
          <table className="w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Category</th>
                <th className="py-3 px-6 text-center">Price</th>
                <th className="py-3 px-6 text-center">Stock</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{product.name}</td>
                  <td className="py-3 px-6 text-left">{product.category}</td>
                  <td className="py-3 px-6 text-center">{product.price}</td>
                  <td className="py-3 px-6 text-center">{product.stock_quantity}</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center">
                      <button className="w-8 h-8 rounded-full bg-blue-500 text-white mr-2">Edit</button>
                      <button onClick={() => deleteProduct(product.id)} className="w-8 h-8 rounded-full bg-red-500 text-white">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Orders</h2>
          <table className="w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Order ID</th>
                <th className="py-3 px-6 text-left">Customer</th>
                <th className="py-3 px-6 text-center">Total</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{order.id}</td>
                  <td className="py-3 px-6 text-left">{order.customer_name}</td>
                  <td className="py-3 px-6 text-center">{order.total_amount}</td>
                  <td className="py-3 px-6 text-center">{order.status}</td>
                  <td className="py-3 px-6 text-center">
                    <button onClick={() => setSelectedOrder(order)} className="w-24 h-8 rounded-full bg-blue-500 text-white">Update Status</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Update Order Status</h2>
            <p className="mb-4">Order ID: {selectedOrder.id}</p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="p-2 border rounded w-full mb-4"
            >
              <option value="">Select Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex justify-end">
              <button onClick={() => setSelectedOrder(null)} className="p-2 mr-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={updateOrderStatus} className="p-2 bg-blue-500 text-white rounded">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
