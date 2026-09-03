"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import DesktopHeader from "@/components/desktop/DesktopHeader";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import {
  Package,
  MapPin,
  CheckCircle2,
  Bike,
  Box,
  ChevronRight,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  X,
  RotateCcw,
  Heart,
  Home,
  Clock,
  Sparkles,
  Phone,
  UserCheck,
} from "lucide-react";

export interface AddressItem {
  id: string;
  type: "HOME" | "WORK" | "OTHER";
  contactName: string;
  phone: string;
  street: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

function DashboardContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addItem } = useCartStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const addAddressPrompt = searchParams.get("addAddress") === "true";

  // Streamlined to Orders and Saved Addresses only
  const [activeTab, setActiveTab] = useState<"orders" | "addresses">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  // Addresses State with Integrated Name and Mobile
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newType, setNewType] = useState<"HOME" | "WORK" | "OTHER">("HOME");

  const containerRef = useRef<HTMLDivElement>(null);
  const ordersListRef = useRef<HTMLDivElement>(null);

  // Guard non-customer roles away from customer dashboard
  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role === "staff") {
        router.replace("/staff");
      } else if (role === "delivery") {
        router.replace("/delivery");
      }
    }
  }, [status, session, router]);

  const displayEmail = session?.user?.email || "";
  const displayName = session?.user?.name || "Customer";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (tabParam === "addresses") {
      setActiveTab("addresses");
      if (addAddressPrompt) {
        setIsAddressModalOpen(true);
      }
    }
  }, [tabParam, addAddressPrompt]);

  // Pre-fill contact name from session for address modal
  useEffect(() => {
    if (session?.user?.name && !newContactName) {
      setNewContactName(session.user.name);
    }
  }, [session, newContactName]);

  useEffect(() => {
    if (!displayEmail) return;
    const stored = localStorage.getItem(`flashkart_addresses_${displayEmail}`);
    if (stored) {
      try {
        setAddresses(JSON.parse(stored));
      } catch {
        setAddresses([]);
      }
    }
  }, [displayEmail]);

  // Real-time polling
  const loadOrders = async () => {
    if (!displayEmail) return;
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(displayEmail)}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [displayEmail]);

  // GSAP: Animate header & cards entrance
  useGSAP(
    () => {
      gsap.from(".gsap-header-card", {
        opacity: 0,
        y: -15,
        duration: 0.45,
        ease: "power2.out",
      });
      gsap.from(".gsap-sidebar-panel", {
        opacity: 0,
        x: -20,
        duration: 0.4,
        ease: "power2.out",
        delay: 0.1,
      });
    },
    { scope: containerRef }
  );

  // GSAP: Stagger orders when list updates
  useGSAP(
    () => {
      if (!loading && orders.length > 0) {
        gsap.fromTo(
          ".gsap-order-card",
          { opacity: 0, y: 18, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.35,
            stagger: 0.06,
            ease: "power2.out",
          }
        );
      }
    },
    { dependencies: [activeTab, loading, orders.length], scope: ordersListRef }
  );

  // 1-Click "Order Again" Handler
  const handleOrderAgain = (order: any, e: React.MouseEvent) => {
    gsap.fromTo(
      e.currentTarget,
      { scale: 0.88 },
      { scale: 1, duration: 0.3, ease: "back.out(2)" }
    );

    setReorderingId(order._id);
    order.items?.forEach((item: any) => {
      addItem({
        _id: item.productId,
        name: item.name,
        price: item.price,
        discountPrice: item.discountPrice || item.price,
        imageUrl: item.imageUrl,
        unit: item.unit || "",
        stock: 50,
      });
    });

    setTimeout(() => {
      setReorderingId(null);
      router.push("/cart");
    }, 500);
  };

  // Add Address with Contact Details
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet || !newCity || !newPincode || !displayEmail || !newPhone) return;

    const newEntry: AddressItem = {
      id: Date.now().toString(),
      type: newType,
      contactName: newContactName.trim() || displayName,
      phone: newPhone.trim(),
      street: newStreet.trim(),
      city: newCity.trim(),
      pincode: newPincode.trim(),
      isDefault: addresses.length === 0,
    };

    const updated = [...addresses, newEntry];
    setAddresses(updated);
    localStorage.setItem(`flashkart_addresses_${displayEmail}`, JSON.stringify(updated));

    setNewStreet("");
    setNewCity("");
    setNewPincode("");
    setNewPhone("");
    setIsAddressModalOpen(false);
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    if (displayEmail) {
      localStorage.setItem(`flashkart_addresses_${displayEmail}`, JSON.stringify(updated));
    }
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    if (displayEmail) {
      localStorage.setItem(`flashkart_addresses_${displayEmail}`, JSON.stringify(updated));
    }
  };

  const getProgressState = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return {
          percentage: "25%",
          step: 1,
          label: "Order Placed & Confirmed",
          sub: "Store staff received the ticket",
        };
      case "PACKING":
        return {
          percentage: "60%",
          step: 2,
          label: "Packing at Dark Store",
          sub: "Items are packed & awaiting rider pickup",
        };
      case "OUT_FOR_DELIVERY":
        return {
          percentage: "85%",
          step: 3,
          label: "Rider Out on Trip",
          sub: "Heading to your doorstep in minutes",
        };
      case "DELIVERED":
        return {
          percentage: "100%",
          step: 4,
          label: "Delivered at Doorstep",
          sub: "Package received",
        };
      default:
        return { percentage: "15%", step: 1, label: "Processing", sub: "" };
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 pb-24">
      <DesktopHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-5">
          <Link href="/" className="hover:text-emerald-600 flex items-center gap-1 transition">
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" /> Back to Store
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">My Account</span>
        </div>

        {/* Dynamic Profile Header */}
        <div className="gsap-header-card bg-white rounded-3xl border border-gray-200 p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {session?.user?.image && !imageError ? (
              <img
                src={session.user.image}
                alt={displayName}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-16 h-16 rounded-2xl border-2 border-emerald-500 object-cover shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-700 font-black text-xl shadow-xs">
                {initials || "U"}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                {displayName}
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{displayEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/wishlist"
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-rose-200 transition active:scale-95 cursor-pointer shadow-xs"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> Wishlist Shelf
            </Link>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Customer
            </span>
          </div>
        </div>

        {/* Layout with Sticky Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Sticky Sidebar with 2 Clean Tabs */}
          <aside className="gsap-sidebar-panel md:col-span-1 space-y-2 sticky top-20 z-20">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 translate-x-1"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>Orders ({orders.length})</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-80" />
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "addresses"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 translate-x-1"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses ({addresses.length})</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-80" />
            </button>
          </aside>

          {/* Main Content Area */}
          <section className="md:col-span-3">
            {activeTab === "orders" && (
              <div ref={ordersListRef} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Your Orders ({orders.length})
                  </h2>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" /> Live Updates Active
                  </span>
                </div>

                {loading && orders.length === 0 ? (
                  <div className="flex justify-center py-16 bg-white rounded-3xl border border-gray-200">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center shadow-xs">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-800 font-bold text-sm">No orders placed under this account</p>
                    <p className="text-xs text-gray-400 mt-0.5">Your 10-minute grocery runs will appear here.</p>
                    <Link
                      href="/"
                      className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-xs"
                    >
                      Start Shopping &rarr;
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const isDelivered = order.status === "DELIVERED";
                    const progress = getProgressState(order.status);
                    const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";

                    return (
                      <div
                        key={order._id}
                        className="gsap-order-card bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4 transition-shadow hover:shadow-md"
                      >
                        <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-2">
                          <div>
                            <span className="font-black text-gray-900 text-sm tracking-tight">
                              {order.orderNumber}
                            </span>
                            <span className="text-[11px] text-gray-400 ml-2">
                              • {new Date(order.createdAt).toLocaleDateString()} at{" "}
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isDelivered ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-800 border border-amber-300 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse shadow-xs">
                                <Bike className="w-3.5 h-3.5" /> Arriving in ~10 mins
                              </span>
                            )}

                            <button
                              onClick={(e) => handleOrderAgain(order, e)}
                              disabled={reorderingId === order._id}
                              className="bg-gray-100 hover:bg-emerald-600 hover:text-white text-gray-700 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95 shadow-xs"
                            >
                              {reorderingId === order._id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                              Order Again
                            </button>
                          </div>
                        </div>

                        {!isDelivered && (
                          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block" />
                                {progress.label}
                              </span>
                              <span className="text-[11px] text-emerald-700 font-semibold font-mono">
                                {progress.percentage}
                              </span>
                            </div>

                            <div className="w-full bg-emerald-200/60 h-2.5 rounded-full overflow-hidden p-0.5">
                              <div
                                style={{ width: progress.percentage }}
                                className="bg-linear-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                              />
                            </div>

                            <div className="grid grid-cols-3 pt-1 text-[11px] text-gray-500 font-semibold">
                              <div
                                className={`flex items-center gap-1.5 ${
                                  progress.step >= 1 ? "text-emerald-800 font-extrabold" : "text-gray-400"
                                }`}
                              >
                                <Box className="w-3.5 h-3.5" /> Packing
                              </div>
                              <div
                                className={`flex items-center justify-center gap-1.5 ${
                                  progress.step >= 3 ? "text-emerald-800 font-extrabold" : "text-gray-400"
                                }`}
                              >
                                <Bike className="w-3.5 h-3.5" /> On the Way
                              </div>
                              <div
                                className={`flex items-center justify-end gap-1.5 ${
                                  progress.step >= 4 ? "text-emerald-800 font-extrabold" : "text-gray-400"
                                }`}
                              >
                                <Home className="w-3.5 h-3.5" /> Doorstep
                              </div>
                            </div>

                            {isOutForDelivery && order.assignedRiderName && (
                              <div className="mt-3 pt-3 border-t border-emerald-200/70 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center border border-amber-300">
                                    <Bike className="w-4 h-4 text-amber-700" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-gray-900 leading-tight">
                                      {order.assignedRiderName}
                                    </p>
                                    <p className="text-[10px] font-semibold text-emerald-700">
                                      Your Delivery Partner
                                    </p>
                                  </div>
                                </div>

                                {order.assignedRiderPhone && (
                                  <a
                                    href={`tel:${order.assignedRiderPhone}`}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition"
                                  >
                                    <Phone className="w-3 h-3" /> Call Rider
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="divide-y divide-gray-50">
                          {order.items?.map((item: any, index: number) => (
                            <div key={index} className="py-2.5 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-11 h-11 object-cover rounded-xl bg-gray-50 border border-gray-100"
                                />
                                <div>
                                  <p className="font-bold text-gray-900">{item.name}</p>
                                  <p className="text-[11px] text-gray-400">
                                    {item.quantity} x {formatPrice(item.price)}{" "}
                                    {item.unit ? `(${item.unit})` : ""}
                                  </p>
                                </div>
                              </div>
                              <span className="font-black text-gray-900">
                                {formatPrice(item.quantity * item.price)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-between text-xs gap-2">
                          <div className="text-gray-500 flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                            </span>
                            {order.deliveryAddress?.phone && (
                              <span className="text-gray-400">• Tel: {order.deliveryAddress.phone}</span>
                            )}
                          </div>
                          <div className="font-black text-gray-900 text-sm">
                            Total Paid: {formatPrice(order.totalAmount)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Delivery Addresses & Contacts</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Riders will use the contact name and mobile number on your selected address
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center shadow-xs">
                    <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-800 font-bold text-sm">No saved delivery addresses</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Add your address with your phone number for rapid 10-minute dispatch.
                    </p>
                    <button
                      onClick={() => setIsAddressModalOpen(true)}
                      className="inline-block mt-4 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Add Address Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-white p-4 rounded-2xl border relative shadow-xs flex flex-col justify-between transition-all ${
                          addr.isDefault
                            ? "border-emerald-500 ring-2 ring-emerald-500/20"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 tracking-wider">
                                {addr.type}
                              </span>
                              {addr.isDefault ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  Default
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSetDefault(addr.id)}
                                  className="text-[10px] text-gray-400 hover:text-emerald-600 hover:underline cursor-pointer"
                                >
                                  Set as default
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-gray-400 hover:text-red-600 p-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 mb-2 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{addr.contactName || displayName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{addr.phone || "No phone added"}</span>
                            </div>
                          </div>

                          <p className="text-xs font-bold text-gray-900 leading-relaxed">{addr.street}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {addr.city} - {addr.pincode}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isAddressModalOpen && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-gray-900 text-sm">Add Delivery Location</h3>
                        <button
                          onClick={() => setIsAddressModalOpen(false)}
                          className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleAddAddress} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                              Receiver Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Full Name"
                              value={newContactName}
                              onChange={(e) => setNewContactName(e.target.value)}
                              className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                              Mobile Number
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="10-digit number"
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value)}
                              className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Address Type
                          </label>
                          <select
                            value={newType}
                            onChange={(e) => setNewType(e.target.value as any)}
                            className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="HOME">Home</option>
                            <option value="WORK">Work</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Street / Door / Flat No
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Flat 402, Green Meadows, 12th Main Road"
                            value={newStreet}
                            onChange={(e) => setNewStreet(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="City"
                              value={newCity}
                              onChange={(e) => setNewCity(e.target.value)}
                              className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                              Pincode
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="6-digit pincode"
                              value={newPincode}
                              onChange={(e) => setNewPincode(e.target.value)}
                              className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => setIsAddressModalOpen(false)}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                          >
                            Save Address
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}