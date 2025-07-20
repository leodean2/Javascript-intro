import React, { useState, useEffect } from "react";
import axios from "axios";

const API = `http://localhost:5001/api`;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      loadUserProfile();
      loadUserOrders();
    }
  }, [token]);

  const loadUserProfile = async () => {
    try {
      const response = await axios.get(`${API}/auth`, {
        headers: { "x-auth-token": token },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadUserOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders/me`, {
        headers: { "x-auth-token": token },
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Error loading user orders:", error);
    }
  };

  if (!token) {
    return <div>Please log in to view your profile.</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <div className="bg-white shadow-md rounded-lg p-8 mb-8">
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <h2 className="text-2xl font-bold mb-4">My Orders</h2>
      <table className="w-full bg-white shadow-md rounded-lg">
        <thead>
          <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left">Order ID</th>
            <th className="py-3 px-6 text-left">Date</th>
            <th className="py-3 px-6 text-center">Total</th>
            <th className="py-3 px-6 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-left whitespace-nowrap">{order.id}</td>
              <td className="py-3 px-6 text-left">{new Date(order.created_at).toLocaleDateString()}</td>
              <td className="py-3 px-6 text-center">{order.total_amount}</td>
              <td className="py-3 px-6 text-center">{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Profile;
