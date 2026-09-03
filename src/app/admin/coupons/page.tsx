"use client";

import React, { useEffect, useState } from "react";
import { TicketPercent, Plus, Trash2, Loader2, CheckCircle2, Percent, Tag } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountPercentage: Number(discountPercentage),
          minOrderValue: Number(minOrderValue) || 0,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCoupons([data.data, ...coupons]);
        setCode("");
        setDiscountPercentage("");
        setMinOrderValue("");
        setSuccess("Coupon created successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to create coupon");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCoupons(coupons.filter((c) => c._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TicketPercent className="w-6 h-6 text-emerald-600" />
          Discount Coupons
        </h1>
        <p className="text-sm text-gray-500">
          Create percentage-based promo codes for store customers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Coupon Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-600" /> Add New Coupon
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </div>
          )}

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Coupon Code</label>
              <div className="relative">
                <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Discount Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  max="90"
                  placeholder="e.g. 25"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 border-gray-300 text-gray-900"
                />
                <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Minimum Cart Value (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0 (No minimum requirement)"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 border-gray-300 text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Coupon"}
            </button>
          </form>
        </div>

        {/* Existing Coupons List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-bold text-gray-900">Active Promo Codes ({coupons.length})</h2>

          {loading ? (
            <div className="flex justify-center py-16 bg-white rounded-2xl border border-gray-200">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
              <TicketPercent className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 font-semibold text-sm">No coupons found</p>
              <p className="text-xs text-gray-400 mt-0.5">Use the form on the left to create percentage discounts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon._id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-black font-mono tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                        {coupon.code}
                      </span>
                      <p className="text-sm font-bold text-gray-900 mt-2">
                        {coupon.discountPercentage}% OFF
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {coupon.minOrderValue > 0
                          ? `Valid on orders above ₹${coupon.minOrderValue}`
                          : "No minimum order amount"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteCoupon(coupon._id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 transition"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Created: {new Date(coupon.createdAt).toLocaleDateString()}</span>
                    <span className="text-emerald-600 font-semibold">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}