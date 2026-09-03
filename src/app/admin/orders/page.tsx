"use client";

import React, { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import {
  ClipboardList,
  Clock,
  Box,
  Bike,
  CheckCircle2,
  MapPin,
  Mail,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto refresh every 15 seconds for live order status
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        alert("Failed to update status: " + data.message);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders =
    filter === "ALL" ? orders : orders.filter((order) => order.status === filter);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-600" />
            Live Orders Pipeline
          </h1>
          <p className="text-sm text-gray-500">
            Monitor real-time customer orders, packing workflows, and dispatch
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Orders
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100">
        {["ALL", "CONFIRMED", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === tab
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.replace(/_/g, " ")} ({tab === "ALL" ? orders.length : orders.filter((o) => o.status === tab).length})
          </button>
        ))}
      </div>

      {/* Orders Grid / List */}
      {loading && orders.length === 0 ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 font-semibold text-sm">No orders matching this status</p>
          <p className="text-gray-400 text-xs mt-0.5">New incoming orders will appear here automatically</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 transition hover:border-gray-300"
            >
              {/* Order Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 text-base">{order.orderNumber}</span>
                  <span className="text-xs text-gray-400">
                    • {new Date(order.createdAt).toLocaleDateString()} at{" "}
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Status:</span>
                  <select
                    value={order.status}
                    disabled={updatingId === order._id}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                      order.status === "DELIVERED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : order.status === "OUT_FOR_DELIVERY"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : order.status === "PACKING"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PACKING">PACKING</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>
              </div>

              {/* Order Items & Customer Meta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Items */}
                <div className="md:col-span-2 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Ordered Items</h4>
                  <div className="divide-y divide-gray-50">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="py-2 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-50 border"
                          />
                          <div>
                            <p className="font-semibold text-gray-800 text-xs">{item.name}</p>
                            <p className="text-[11px] text-gray-400">
                              Qty: {item.quantity} {item.unit ? `• ${item.unit}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-gray-900">
                          {formatPrice(item.quantity * item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery & Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-xs border border-gray-100 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-bold uppercase tracking-wider text-gray-400">Customer Info</h4>
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{order.userEmail}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span>
                        {order.deliveryAddress?.street}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>Total Amount:</span>
                    <span className="text-emerald-700 text-base">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}