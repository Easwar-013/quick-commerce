"use client";

import React, { useEffect, useState } from "react";
import { Boxes, AlertTriangle, CheckCircle2, Plus, Loader2, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"LOW" | "ALL" | "OUT">("LOW");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleQuickRestock = async (productId: string, increment: number) => {
    setUpdatingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? { ...p, stock: p.stock + increment } : p))
        );
      } else {
        alert(data.error || "Failed to update stock");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (filterMode === "LOW") return p.stock <= 3 && p.stock > 0;
    if (filterMode === "OUT") return p.stock <= 0;
    return true;
  });

  const lowStockCount = products.filter((p) => p.stock <= 3 && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600" />
            Inventory & Stock Manager
          </h1>
          <p className="text-sm text-gray-500">
            Real-time replenishment and low-stock monitor
          </p>
        </div>

        <button
          onClick={fetchProducts}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilterMode("LOW")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterMode === "LOW" ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300" : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-700">Low Stock (≤ 3)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">{lowStockCount}</p>
        </div>

        <div
          onClick={() => setFilterMode("OUT")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterMode === "OUT" ? "bg-red-50 border-red-300 ring-1 ring-red-300" : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-red-700">Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-900 mt-2">{outOfStockCount}</p>
        </div>

        <div
          onClick={() => setFilterMode("ALL")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterMode === "ALL" ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300" : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-700">Total Items</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2">{products.length}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800">All inventory items are well-stocked</p>
            <p className="text-xs text-gray-400 mt-0.5">No products require immediate restocking under this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProducts.map((p) => (
              <div key={p._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition">
                <div className="flex items-center gap-3.5">
                  <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover border bg-gray-50" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-400">{p.category} {p.unit ? `• ${p.unit}` : ""} • {formatPrice(p.discountPrice || p.price)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                        p.stock <= 0
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : p.stock <= 3
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {p.stock} units left
                    </span>
                  </div>

                  {/* 1-Click Restock Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuickRestock(p._id, 10)}
                      disabled={updatingId === p._id}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold text-gray-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" /> 10
                    </button>
                    <button
                      onClick={() => handleQuickRestock(p._id, 25)}
                      disabled={updatingId === p._id}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold text-gray-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" /> 25
                    </button>
                    <button
                      onClick={() => handleQuickRestock(p._id, 50)}
                      disabled={updatingId === p._id}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold text-gray-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" /> 50
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}