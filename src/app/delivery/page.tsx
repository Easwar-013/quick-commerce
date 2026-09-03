"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  LogOut,
  RefreshCw,
  Loader2,
  PackageCheck,
  Navigation,
  User,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function DeliveryAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeOrdersRef = useRef<HTMLDivElement>(null);

  const riderEmail = session?.user?.email?.toLowerCase().trim() || "";
  const riderName = session?.user?.name || "Delivery Partner";
  const riderPhone = (session?.user as any)?.phone || "";

  const fetchDeliveryOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      (session?.user as any)?.role !== "delivery" &&
      (session?.user as any)?.role !== "admin"
    ) {
      router.push("/");
    } else if (status === "authenticated") {
      fetchDeliveryOrders();
      const interval = setInterval(fetchDeliveryOrders, 3000);
      return () => clearInterval(interval);
    }
  }, [status, session, router]);

  // GSAP Header entrance
  useGSAP(
    () => {
      gsap.from(".gsap-rider-header", {
        y: -20,
        opacity: 0,
        duration: 0.45,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  // GSAP card animations
  useGSAP(
    () => {
      if (orders.length > 0) {
        gsap.fromTo(
          ".gsap-rider-card",
          { opacity: 0, y: 15, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.05, ease: "power2.out" }
        );
      }
    },
    { dependencies: [orders.length], scope: activeOrdersRef }
  );

  const handleClaimAndStartTrip = async (orderId: string, e: React.MouseEvent) => {
    gsap.fromTo(e.currentTarget, { scale: 0.95 }, { scale: 1, duration: 0.25, ease: "back.out(2)" });
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "OUT_FOR_DELIVERY",
          assignedRiderEmail: riderEmail,
          assignedRiderName: riderName,
          assignedRiderPhone: riderPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? data.data : o)));
      }
    } catch (err: any) {
      alert("Failed to claim order: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkDelivered = async (orderId: string, e: React.MouseEvent) => {
    gsap.fromTo(e.currentTarget, { scale: 0.95 }, { scale: 1, duration: 0.25, ease: "back.out(2)" });
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DELIVERED",
          assignedRiderEmail: riderEmail,
          assignedRiderName: riderName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? data.data : o)));
      }
    } catch (err: any) {
      alert("Status update failed: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const availableOrders = orders.filter(
    (o) => o.status === "PACKING" && (!o.assignedRiderEmail || o.assignedRiderEmail === "")
  );

  const myActiveOrders = orders.filter(
    (o) => o.status === "OUT_FOR_DELIVERY" && o.assignedRiderEmail === riderEmail
  );

  const myCompletedOrders = orders.filter(
    (o) => o.status === "DELIVERED" && o.assignedRiderEmail === riderEmail
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-100 pb-16">
      {/* Header */}
      <header className="gsap-rider-header bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-2xl shadow-xs">
              <Bike className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="font-black text-gray-900 text-sm tracking-tight block">
                FlashKart Rider App
              </span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                Partner: {riderName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDeliveryOrders}
              disabled={loading}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              title="Refresh Tasks"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-xl border border-gray-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main ref={activeOrdersRef} className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* SECTION 1: MY ACTIVE TRIP */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Bike className="w-5 h-5 text-emerald-600" />
              My Active Deliveries ({myActiveOrders.length})
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Assigned to you
            </span>
          </div>

          {myActiveOrders.length === 0 ? (
            <div className="bg-white p-6 rounded-3xl border border-dashed border-gray-300 text-center">
              <p className="text-xs text-gray-400 font-medium">You have no active trips currently in transit.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myActiveOrders.map((order) => {
                const addressQuery = encodeURIComponent(
                  `${order.deliveryAddress?.street || ""}, ${order.deliveryAddress?.city || ""} ${
                    order.deliveryAddress?.pincode || ""
                  }`
                );

                const customerDisplayName =
                  order.customerName || order.userEmail?.split("@")[0] || "Customer";
                const customerPhoneNum =
                  order.customerPhone || order.deliveryAddress?.phone || null;

                return (
                  <div
                    key={order._id}
                    className="gsap-rider-card bg-white rounded-3xl border-2 border-emerald-500 shadow-md p-5 space-y-4 ring-4 ring-emerald-500/10"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-base font-black text-gray-900">{order.orderNumber}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          • {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full border bg-amber-100 text-amber-900 border-amber-300 animate-pulse">
                        Trip In Progress
                      </span>
                    </div>

                    {/* Customer Info, Address & Navigation */}
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 text-xs">
                          {/* Customer Name & Mobile */}
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                              <User className="w-3.5 h-3.5 text-emerald-600" /> {customerDisplayName}
                            </span>
                            {customerPhoneNum && (
                              <a
                                href={`tel:${customerPhoneNum}`}
                                className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition"
                              >
                                <Phone className="w-3 h-3 text-emerald-700" /> {customerPhoneNum}
                              </a>
                            )}
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-black text-gray-900 uppercase tracking-wider text-[10px] bg-white px-1.5 py-0.2 rounded border border-gray-200 inline-block mb-0.5">
                                {order.deliveryAddress?.type || "HOME"}
                              </span>
                              <p className="text-gray-900 font-bold leading-relaxed">
                                {order.deliveryAddress?.street}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                              </p>
                            </div>
                          </div>
                        </div>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs transition"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Navigate
                        </a>
                      </div>

                      <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-gray-600 font-medium">{order.userEmail}</span>
                        <div className="flex items-center gap-1 font-bold text-gray-900">
                          <span className="text-gray-500 font-normal text-[11px]">Collect Cash:</span>
                          <span className="text-emerald-700 text-sm font-black">{formatPrice(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Package Contents */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Package Contents ({order.items?.length || 0} items)
                      </p>
                      <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100 px-3.5 py-1 text-xs">
                        {order.items?.map((item: any, i: number) => (
                          <div key={i} className="py-2 flex justify-between items-center">
                            <span className="font-bold text-gray-800">
                              {item.quantity}x {item.name} {item.unit ? `(${item.unit})` : ""}
                            </span>
                            <span className="text-gray-500">{formatPrice(item.price)} each</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deliver Action */}
                    <button
                      onClick={(e) => handleMarkDelivered(order._id, e)}
                      disabled={updatingId === order._id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      {updatingId === order._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Hand Over & Mark Order Delivered
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: UNCLAIMED ORDERS AVAILABLE FOR PICKUP */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Available for Pickup at Dark Store ({availableOrders.length})
            </h2>
            <span className="text-[11px] font-semibold text-gray-500">First-come, first-served</span>
          </div>

          {availableOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center">
              <PackageCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">No new packed orders waiting at the dark store.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => {
                const customerDisplayName =
                  order.customerName || order.userEmail?.split("@")[0] || "Customer";
                const customerPhoneNum =
                  order.customerPhone || order.deliveryAddress?.phone || null;

                return (
                  <div
                    key={order._id}
                    className="gsap-rider-card bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-base font-black text-gray-900">{order.orderNumber}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          • {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                        Packed & Ready
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                        <span>Customer: {customerDisplayName}</span>
                        {customerPhoneNum && <span className="text-gray-500">• {customerPhoneNum}</span>}
                      </div>
                      <p className="text-gray-700 font-medium">
                        Destination: <strong>{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</strong>
                      </p>
                      <p className="text-gray-500">
                        Items: <strong>{order.items?.length || 0} items</strong> • Total:{" "}
                        <strong className="text-emerald-700">{formatPrice(order.totalAmount)}</strong>
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleClaimAndStartTrip(order._id, e)}
                      disabled={updatingId === order._id}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl text-xs transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      {updatingId === order._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bike className="w-4 h-4" />
                      )}
                      Pick Up Bag & Start Delivery Trip
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: THIS RIDER'S FULFILLED DELIVERIES */}
        {myCompletedOrders.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              My Completed Deliveries ({myCompletedOrders.length})
            </h3>
            <div className="space-y-2">
              {myCompletedOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between text-xs shadow-xs"
                >
                  <div>
                    <span className="font-bold text-gray-900">{order.orderNumber}</span>
                    <p className="text-[11px] text-gray-400">
                      {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[11px] inline-block mb-0.5">
                      Delivered by You
                    </span>
                    <p className="text-[10px] text-gray-400 font-semibold">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}