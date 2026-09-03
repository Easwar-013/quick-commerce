"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Boxes,
  Clock,
  LogOut,
  RefreshCw,
  Loader2,
  CheckSquare,
  Square,
  PackageCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function StoreStaffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const ordersRef = useRef<HTMLDivElement>(null);

  const staffEmail = session?.user?.email?.toLowerCase().trim() || "";
  const staffName = session?.user?.name || "Staff Member";

  const fetchOrders = async () => {
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
      (session?.user as any)?.role !== "staff" &&
      (session?.user as any)?.role !== "admin"
    ) {
      router.push("/");
    } else if (status === "authenticated") {
      fetchOrders();
      const interval = setInterval(fetchOrders, 4000);
      return () => clearInterval(interval);
    }
  }, [status, session, router]);

  useGSAP(
    () => {
      gsap.from(".gsap-staff-header", {
        y: -15,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  useGSAP(
    () => {
      if (orders.length > 0) {
        gsap.fromTo(
          ".gsap-staff-card",
          { opacity: 0, y: 15, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.05, ease: "power2.out" }
        );
      }
    },
    { dependencies: [orders.length], scope: ordersRef }
  );

  const toggleItemCheck = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMarkPacked = async (orderId: string, e: React.MouseEvent) => {
    gsap.fromTo(e.currentTarget, { scale: 0.95 }, { scale: 1, duration: 0.25, ease: "back.out(2)" });
    setSubmittingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PACKING",
          packedByEmail: staffEmail,
          packedByName: staffName,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? data.data : o)));
      } else {
        alert("Failed to update status: " + (data.error || "Server error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "CONFIRMED");
  const myPackedHistory = orders.filter(
    (o) => o.packedByEmail === staffEmail && o.status !== "CONFIRMED"
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-100 pb-16">
      {/* Header */}
      <header className="gsap-staff-header bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-2xl shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-gray-900 text-sm tracking-tight block">
                Dark Store Station
              </span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                Picker: {staffName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              title="Refresh Orders"
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

      <main ref={ordersRef} className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* SECTION 1: ORDERS WAITING TO BE PACKED */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Orders to Pack ({pendingOrders.length})
            </h2>
            <span className="text-xs text-gray-500 font-medium">Auto-syncs every 4s</span>
          </div>

          {loading && orders.length === 0 ? (
            <div className="flex justify-center py-16 bg-white rounded-3xl border border-gray-200">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center shadow-xs">
              <PackageCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-gray-800">All orders are packed!</h3>
              <p className="text-xs text-gray-400 mt-1">Waiting for incoming customer checkouts...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order) => {
                const allChecked =
                  order.items &&
                  order.items.length > 0 &&
                  order.items.every((_: any, i: number) => checkedItems[`${order._id}-${i}`]);

                return (
                  <div
                    key={order._id}
                    className="gsap-staff-card bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-base font-black text-gray-900">{order.orderNumber}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          • {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
                        Needs Packing
                      </span>
                    </div>

                    {/* Checklist of products */}
                    <div className="space-y-2">
                      {order.items?.map((item: any, i: number) => {
                        const isDone = !!checkedItems[`${order._id}-${i}`];
                        return (
                          <div
                            key={i}
                            onClick={() => toggleItemCheck(order._id, i)}
                            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition select-none ${
                              isDone
                                ? "bg-emerald-50/50 border-emerald-300"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100/70"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover bg-white border"
                              />
                              <div>
                                <p
                                  className={`text-xs font-bold ${
                                    isDone ? "line-through text-gray-400" : "text-gray-900"
                                  }`}
                                >
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                  Pick: <strong className="text-gray-800">{item.quantity} units</strong>{" "}
                                  {item.unit ? `(${item.unit})` : ""}
                                </p>
                              </div>
                            </div>
                            <div>
                              {isDone ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={(e) => handleMarkPacked(order._id, e)}
                      disabled={!allChecked || submittingId === order._id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
                    >
                      {submittingId === order._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <PackageCheck className="w-4 h-4" /> Ready for Rider Pickup
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: PACKED BY THIS STAFF MEMBER */}
        {myPackedHistory.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Packed by You ({myPackedHistory.length})
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Personal History
              </span>
            </div>

            <div className="space-y-2">
              {myPackedHistory.map((order) => (
                <div
                  key={order._id}
                  className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between text-xs shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{order.orderNumber}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 font-medium">
                        {order.items?.length || 0} items
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Destination: {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 border ${
                        order.status === "DELIVERED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : order.status === "OUT_FOR_DELIVERY"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {order.status === "DELIVERED"
                        ? "Delivered"
                        : order.status === "OUT_FOR_DELIVERY"
                        ? "Out on Trip"
                        : "Ready for Pickup"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      Total: {formatPrice(order.totalAmount)}
                    </span>
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