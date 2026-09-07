"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  PlusCircle,
  Tag,
  X,
  ShoppingBag,
  Crosshair,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";
import DesktopHeader from "@/components/desktop/DesktopHeader";
import { CompactStepper } from "@/components/ui/compact-stepper";
import { SlidingNumber } from "@/components/ui/sliding-number";

interface AddressItem {
  id: string;
  type: "HOME" | "WORK" | "OTHER";
  contactName?: string;
  street: string;
  city: string;
  pincode: string;
  phone?: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");

  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercentage: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const subtotal = getTotalPrice();
  const deliveryFee = subtotal > 199 || subtotal === 0 ? 0 : 25;
  const couponDiscount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPercentage) / 100) : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  useEffect(() => {
    if (!session?.user?.email) return;
    const stored = localStorage.getItem(`flashkart_addresses_${session.user.email}`);
    if (stored) {
      try {
        const parsed: AddressItem[] = JSON.parse(stored);
        setAddresses(parsed);
        const defaultAddr = parsed.find((a) => a.isDefault) || parsed[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      } catch {
        setAddresses([]);
      }
    }
  }, [session?.user?.email]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCodeInput.trim(), orderAmount: subtotal }),
      });

      const data = await res.json();

      if (data.success) {
        setAppliedCoupon({
          code: data.data.code,
          discountPercentage: data.data.discountPercentage,
        });
        setCouponCodeInput("");
      } else {
        setCouponError(data.error || "Invalid coupon code");
      }
    } catch (err: any) {
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleStepperChange = (id: string, currentQty: number, nextQty: number) => {
    if (nextQty <= 0) {
      removeItem(id);
    } else {
      const diff = nextQty - currentQty;
      updateQuantity(id, diff);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!session?.user?.email) {
      alert("Please sign in to complete your purchase.");
      router.push("/login");
      return;
    }

    if (addresses.length === 0) {
      router.push("/dashboard?tab=addresses&addAddress=true");
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
    if (!selectedAddr) {
      alert("Please select a delivery address.");
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        userEmail: session.user.email,
        customerName: selectedAddr.contactName || session.user.name || "Customer",
        customerPhone: selectedAddr.phone || (session.user as any)?.phone || "",
        items: items.map((item) => ({
          productId: item._id,
          name: item.name,
          price: item.discountPrice || item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          unit: item.unit || "",
        })),
        subtotal,
        deliveryFee,
        totalAmount: grandTotal,
        couponCode: appliedCoupon?.code || null,
        couponDiscount,
        deliveryAddress: {
          street: selectedAddr.street,
          city: selectedAddr.city,
          pincode: selectedAddr.pincode,
          type: selectedAddr.type,
          phone: selectedAddr.phone || (session.user as any)?.phone || "",
          lat: selectedAddr.lat,
          lng: selectedAddr.lng,
        },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (data.success) {
        setPlacedOrderNumber(data.data.orderNumber);
        setOrderPlaced(true);
        clearCart();
      } else {
        alert("Failed to place order: " + (data.error || "Server error"));
      }
    } catch (err: any) {
      alert("Order error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DesktopHeader />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h2>
          <p className="text-sm font-semibold text-emerald-700 mt-1">Order ID: {placedOrderNumber}</p>
          <p className="text-sm text-gray-500 mt-2">
            Your items are being packed and will arrive in 10 minutes.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Link
              href="/dashboard"
              className="bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition"
            >
              Track Order
            </Link>
            <Link
              href="/"
              className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <DesktopHeader />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" /> Back to Store Feed
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-gray-800">Your basket is empty</h2>
            <p className="text-xs text-gray-400 mt-1">Add items from the store to get them delivered in 10 minutes.</p>
            <Link
              href="/"
              className="inline-block mt-4 bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Items & Delivery Address */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-2.5">
                {items.map((item) => {
                  const itemUnitPrice = item.discountPrice || item.price;
                  const itemTotalPrice = itemUnitPrice * item.quantity;

                  return (
                    <div
                      key={item._id}
                      className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-100"
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                          {item.unit && <p className="text-xs text-gray-400">{item.unit}</p>}
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 mt-0.5">
                            <span className="inline-flex items-center">
                              ₹<SlidingNumber number={itemTotalPrice} />
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[11px] font-normal text-gray-400">
                                ({formatPrice(itemUnitPrice)} each)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <CompactStepper
                          value={item.quantity}
                          min={0}
                          max={item.stock || 99}
                          onChange={(nextVal) => handleStepperChange(item._id, item.quantity, nextVal)}
                        />

                        <button
                          onClick={() => removeItem(item._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition cursor-pointer"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Address Section */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Delivery Location
                  </h3>
                  <Link
                    href="/dashboard?tab=addresses&addAddress=true"
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Manage
                  </Link>
                </div>

                {addresses.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                    <span>No delivery address found. Add one to complete checkout.</span>
                    <Link
                      href="/dashboard?tab=addresses&addAddress=true"
                      className="font-bold text-emerald-700 underline shrink-0 ml-2"
                    >
                      Add Address
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          selectedAddressId === addr.id
                            ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-gray-900">
                            <span>{addr.type}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-normal border border-emerald-200">
                                Default
                              </span>
                            )}
                            {addr.lat && addr.lng && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold border border-emerald-300 inline-flex items-center gap-0.5">
                                <Crosshair className="w-2.5 h-2.5" /> Doorstep Pinned
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mt-0.5 font-medium">
                            {addr.street}, {addr.city} - {addr.pincode}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Bill Details & Aligned Coupon Box */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" /> Apply Coupon
                </h4>

                {appliedCoupon ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-emerald-800 font-mono tracking-wider">
                        {appliedCoupon.code}
                      </span>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        {appliedCoupon.discountPercentage}% discount applied!
                      </p>
                    </div>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-gray-400 hover:text-red-600 p-1 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <div className="relative flex items-center w-full">
                      <input
                        type="text"
                        placeholder="E.G. FLASH25"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        className="w-full h-10 pl-3 pr-20 border border-gray-300 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-900 bg-gray-50"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponCodeInput.trim()}
                        className="absolute right-1 top-1 bottom-1 px-4 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition flex items-center justify-center disabled:opacity-40 cursor-pointer"
                      >
                        {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {couponError && <p className="text-red-500 text-[11px] font-medium">{couponError}</p>}
                  </form>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between items-center">
                  <span>Item Total</span>
                  <span className="font-bold text-gray-900 inline-flex items-center">
                    ₹<SlidingNumber number={subtotal} />
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-600 font-bold">
                    <span>Coupon ({appliedCoupon.discountPercentage}%)</span>
                    <span className="inline-flex items-center">
                      -₹<SlidingNumber number={couponDiscount} />
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Delivery Charge</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase">Free</span>
                    ) : (
                      <span className="font-semibold text-gray-900 inline-flex items-center">
                        ₹<SlidingNumber number={deliveryFee} />
                      </span>
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center font-black text-gray-900 text-sm">
                  <span>To Pay</span>
                  <span className="inline-flex items-center">
                    ₹<SlidingNumber number={grandTotal} />
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition text-xs shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : addresses.length === 0 ? (
                  "Add Address to Pay"
                ) : (
                  <span className="inline-flex items-center gap-1">
                    Place Order • ₹<SlidingNumber number={grandTotal} />
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}