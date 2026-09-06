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
  Radio,
  Crosshair,
  ArrowLeft,
  MessageSquare,
  Maximize2,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

// In-app Leaflet Turn-by-Turn Navigation Modal for Delivery Partner
function RiderNavigationModal({
  order,
  riderPhone,
  onClose,
  onMarkDelivered,
  isDelivering,
}: {
  order: any;
  riderPhone?: string;
  onClose: () => void;
  onMarkDelivered: (orderId: string) => void;
  isDelivering: boolean;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number }>({
    lat: order.riderLocation?.lat || 10.7656,
    lng: order.riderLocation?.lng || 79.8428,
  });
  const [routeStats, setRouteStats] = useState({ distanceKm: "Calculating...", durationMins: "Calculating..." });

  const customerName = order.customerName || order.userEmail?.split("@")[0] || "Customer";
  const customerPhone = order.customerPhone || order.deliveryAddress?.phone || null;
  const address = order.deliveryAddress;

  // 1. Resolve Customer Destination Coordinates
  useEffect(() => {
    if (!address) return;

    // Direct Rooftop accuracy if customer tapped or saved map coordinates
    if (
      address.lat &&
      address.lng &&
      typeof address.lat === "number" &&
      typeof address.lng === "number"
    ) {
      setCustomerCoords({ lat: address.lat, lng: address.lng });
      return;
    }

    // Geocoding fallback with Photon and Nominatim for text-only addresses
    async function resolveCoords() {
      const cleanStreet = (address.street || "")
        .replace(/opp|opposite|near|behind|beside|adj|floor|flat|door\s*no|d\.no|h\.no/gi, " ")
        .replace(/[,\-_#\/]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const cleanCity = address.city?.trim() || "";
      const cleanPincode = address.pincode?.trim() || "";

      // Photon fuzzy match
      if (cleanStreet || cleanCity) {
        try {
          const photonQuery = `${cleanStreet} ${cleanCity}`.trim();
          const pRes = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(photonQuery)}&limit=1`
          );
          const pData = await pRes.json();
          if (pData?.features && pData.features.length > 0) {
            const [lon, latCoord] = pData.features[0].geometry.coordinates;
            setCustomerCoords({ lat: latCoord, lng: lon });
            return;
          }
        } catch (err) {
          console.warn("Photon fallback error:", err);
        }
      }

      // Nominatim search
      try {
        const query = cleanPincode
          ? `${cleanPincode}, ${cleanCity}, Tamil Nadu, India`
          : `${cleanCity}, Tamil Nadu, India`;
        const nRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );
        const nData = await nRes.json();
        if (nData && nData.length > 0) {
          setCustomerCoords({
            lat: parseFloat(nData[0].lat),
            lng: parseFloat(nData[0].lon),
          });
          return;
        }
      } catch (err) {
        console.warn("Nominatim fallback error:", err);
      }

      // Default Tamil Nadu fallback
      setCustomerCoords({ lat: 10.7656, lng: 79.8428 });
    }

    resolveCoords();
  }, [address?.lat, address?.lng, address?.street, address?.city, address?.pincode]);

  // 2. Track Live Rider GPS inside navigation
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setRiderCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.warn("Rider nav GPS error:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!customerCoords || !mapContainerRef.current || leafletMapRef.current) return;
    let isMounted = true;

    async function initNavMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [(riderCoords.lat + customerCoords!.lat) / 2, (riderCoords.lng + customerCoords!.lng) / 2],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Customer Destination Pin (Red)
      const destIcon = L.divIcon({
        className: "dest-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 38px; height: 38px; background: #e11d48; border-radius: 12px 12px 2px 12px; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 18px rgba(225,29,72,0.4); border: 2.5px solid #ffffff;">
              <svg style="transform: rotate(-45deg); width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div style="background: #1e1b4b; color: #ffffff; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); white-space: nowrap; margin-top: 4px; border: 1px solid rgba(255,255,255,0.2); z-index: 10;">
              Customer Doorstep
            </div>
          </div>
        `,
        iconSize: [38, 55],
        iconAnchor: [19, 44],
      });
      destMarkerRef.current = L.marker([customerCoords!.lat, customerCoords!.lng], { icon: destIcon }).addTo(map);

      // Rider Pin (Purple Bike with Pulse)
      const bikerIcon = L.divIcon({
        className: "rider-nav-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="position: absolute; top: 2px; width: 44px; height: 44px; background: rgba(16, 185, 129, 0.3); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 42px; height: 42px; background: #059669; border-radius: 14px; border: 2.5px solid #ffffff; box-shadow: 0 10px 20px rgba(5, 150, 105, 0.45); display: flex; align-items: center; justify-content: center; z-index: 10;">
              <svg style="width: 22px; height: 22px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <circle cx="15" cy="5" r="1"/>
                <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
              </svg>
            </div>
            <div style="background: #064e3b; color: #ffffff; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); white-space: nowrap; margin-top: 4px; border: 1px solid rgba(255,255,255,0.2); z-index: 10;">
              You (Rider)
            </div>
          </div>
        `,
        iconSize: [44, 60],
        iconAnchor: [22, 30],
      });
      riderMarkerRef.current = L.marker([riderCoords.lat, riderCoords.lng], { icon: bikerIcon }).addTo(map);

      // Fetch Turn-by-Turn OSRM Route
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${riderCoords.lng},${riderCoords.lat};${customerCoords!.lng},${customerCoords!.lat}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const routeData = await res.json();

        if (routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];
          const latLngs = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

          const polyline = L.polyline(latLngs, {
            color: "#059669",
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          routeLineRef.current = polyline;
          map.fitBounds(polyline.getBounds(), { padding: [55, 55] });

          const distanceKm = (route.distance / 1000).toFixed(1) + " km";
          const durationMins = Math.max(1, Math.ceil(route.duration / 60)) + " mins";
          setRouteStats({ distanceKm, durationMins });
        }
      } catch {
        const polyline = L.polyline(
          [
            [riderCoords.lat, riderCoords.lng],
            [customerCoords!.lat, customerCoords!.lng],
          ],
          { color: "#059669", weight: 4, dashArray: "6, 8" }
        ).addTo(map);
        routeLineRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      leafletMapRef.current = map;
    }

    initNavMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [customerCoords]);

  // 4. Update markers & route when rider moves
  useEffect(() => {
    if (!leafletMapRef.current || !customerCoords) return;

    if (riderMarkerRef.current && riderCoords.lat && riderCoords.lng) {
      riderMarkerRef.current.setLatLng([riderCoords.lat, riderCoords.lng]);
    }

    if (riderCoords.lat && riderCoords.lng && customerCoords.lat && customerCoords.lng) {
      fetch(
        `https://router.project-osrm.org/route/v1/driving/${riderCoords.lng},${riderCoords.lat};${customerCoords.lng},${customerCoords.lat}?overview=full&geometries=geojson`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.routes && data.routes.length > 0 && routeLineRef.current) {
            const latLngs = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            routeLineRef.current.setLatLngs(latLngs);

            const distanceKm = (data.routes[0].distance / 1000).toFixed(1) + " km";
            const durationMins = Math.max(1, Math.ceil(data.routes[0].duration / 60)) + " mins";
            setRouteStats({ distanceKm, durationMins });
          }
        })
        .catch(() => {});
    }
  }, [riderCoords.lat, riderCoords.lng, customerCoords]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] max-w-sm sm:max-w-md w-full h-[90vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden relative font-sans">
        {/* Modal Header */}
        <div className="bg-white px-5 pt-4 pb-3 border-b border-gray-100 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 -ml-1 text-gray-700 hover:text-gray-900 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm tracking-tight">
                Live Rider Navigation
              </h3>
              <p className="text-[11px] font-semibold text-gray-400">
                Order #{order.orderNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {customerPhone && (
              <>
                <a
                  href={`sms:${customerPhone}`}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 flex items-center justify-center transition active:scale-95"
                  title="SMS Customer"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
                <a
                  href={`tel:${customerPhone}`}
                  className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center transition active:scale-95"
                  title="Call Customer"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Body */}
        <div className="relative flex-1 overflow-hidden flex flex-col">
          {!customerCoords ? (
            <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-bold text-gray-700">Connecting to doorstep location...</p>
            </div>
          ) : (
            <div ref={mapContainerRef} className="relative flex-1 w-full h-full" />
          )}

          {/* Floating Customer Info Overlay */}
          <div className="absolute top-3 inset-x-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-200 shadow-md z-[1000] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-gray-900 text-xs block">{customerName}</span>
                <span className="text-[11px] text-gray-500 font-medium truncate max-w-[200px] block">
                  {address?.street}, {address?.city}
                </span>
              </div>
            </div>

            {address?.lat && address?.lng ? (
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md shrink-0">
                GPS Doorstep
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md shrink-0">
                Text Addr
              </span>
            )}
          </div>

          {/* Bottom Controls Card */}
          <div className="bg-white p-4 rounded-t-[32px] border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-20 space-y-3.5">
            <div className="flex items-center justify-around px-4">
              <div className="text-center">
                <span className="text-base font-black text-gray-900 block">{routeStats.distanceKm}</span>
                <span className="text-[11px] font-semibold text-gray-400">Remaining</span>
              </div>

              <div className="h-7 w-px bg-gray-100" />

              <div className="text-center">
                <span className="text-base font-black text-gray-900 block">{routeStats.durationMins}</span>
                <span className="text-[11px] font-semibold text-gray-400">ETA</span>
              </div>

              <div className="h-7 w-px bg-gray-100" />

              <div className="text-center">
                <span className="text-base font-black text-emerald-700 block">{formatPrice(order.totalAmount)}</span>
                <span className="text-[11px] font-semibold text-gray-400">Collect Cash</span>
              </div>
            </div>

            <button
              onClick={() => onMarkDelivered(order._id)}
              disabled={isDelivering}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isDelivering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Complete Delivery at Doorstep</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [navigatingOrder, setNavigatingOrder] = useState<any | null>(null);

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

  const myActiveOrders = orders.filter(
    (o) => o.status === "OUT_FOR_DELIVERY" && o.assignedRiderEmail === riderEmail
  );

  // Broadcast Real-Time GPS from Rider Device
  useEffect(() => {
    if (myActiveOrders.length === 0) {
      setGpsActive(false);
      return;
    }

    const activeOrderId = myActiveOrders[0]._id;

    if (!("geolocation" in navigator)) {
      console.warn("Geolocation not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        setGpsActive(true);
        try {
          await fetch(`/api/orders/${activeOrderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              riderLocation: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            }),
          });
        } catch (err) {
          console.error("Failed to transmit GPS:", err);
        }
      },
      (error) => {
        console.warn("GPS tracking error:", error.message);
        setGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 4000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setGpsActive(false);
    };
  }, [myActiveOrders.length, myActiveOrders[0]?._id]);

  useGSAP(
    () => {
      gsap.from(".skiper-header", {
        y: -18,
        opacity: 0,
        duration: 0.45,
        ease: "power3.out",
      });
    },
    { scope: containerRef }
  );

  useGSAP(
    () => {
      if (orders.length > 0) {
        gsap.fromTo(
          ".skiper-rider-card",
          { opacity: 0, y: 14, scale: 0.98 },
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
      let initialLat: number | undefined;
      let initialLng: number | undefined;

      if ("geolocation" in navigator) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              initialLat = pos.coords.latitude;
              initialLng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 4000 }
          );
        });
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "OUT_FOR_DELIVERY",
          assignedRiderEmail: riderEmail,
          assignedRiderName: riderName,
          assignedRiderPhone: riderPhone,
          ...(initialLat && initialLng ? { riderLocation: { lat: initialLat, lng: initialLng } } : {}),
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

  const handleMarkDelivered = async (orderId: string, e?: React.MouseEvent) => {
    if (e) {
      gsap.fromTo(e.currentTarget, { scale: 0.95 }, { scale: 1, duration: 0.25, ease: "back.out(2)" });
    }
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
        if (navigatingOrder?._id === orderId) {
          setNavigatingOrder(null);
        }
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

  const myCompletedOrders = orders.filter(
    (o) => o.status === "DELIVERED" && o.assignedRiderEmail === riderEmail
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-100 pb-16">
      <header className="skiper-header bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-2xl shadow-xs shrink-0">
              <Bike className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="font-black text-gray-900 text-sm tracking-tight block">
                FlashKart Rider App
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                  Partner: {riderName}
                </span>
                {gpsActive && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" /> Live GPS
                  </span>
                )}
              </div>
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
        {/* Active Trip */}
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
                const hasCoordinates = Boolean(
                  order.deliveryAddress?.lat &&
                  order.deliveryAddress?.lng &&
                  typeof order.deliveryAddress.lat === "number" &&
                  typeof order.deliveryAddress.lng === "number"
                );

                const customerDisplayName =
                  order.customerName || order.userEmail?.split("@")[0] || "Customer";
                const customerPhoneNum =
                  order.customerPhone || order.deliveryAddress?.phone || null;

                return (
                  <div
                    key={order._id}
                    className="skiper-rider-card bg-white rounded-3xl border-2 border-emerald-500 shadow-md p-5 space-y-4 ring-4 ring-emerald-500/10 transition-all duration-300"
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

                    <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2.5 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                              <span>{customerDisplayName}</span>
                            </span>

                            {customerPhoneNum && (
                              <a
                                href={`tel:${customerPhoneNum}`}
                                className="inline-flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-300/70 transition-colors shadow-2xs cursor-pointer active:scale-95"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0 stroke-[2.5]" />
                                <span>{customerPhoneNum}</span>
                              </a>
                            )}
                          </div>

                          <div className="flex items-start gap-2 pt-0.5">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-gray-900 uppercase tracking-wider text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 inline-block">
                                  {order.deliveryAddress?.type || "HOME"}
                                </span>

                                {hasCoordinates ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                                    <Crosshair className="w-3 h-3 text-emerald-600" />
                                    GPS Doorstep Pinned
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                                    Text Address
                                  </span>
                                )}
                              </div>

                              <p className="text-gray-900 font-bold leading-relaxed">
                                {order.deliveryAddress?.street}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                              </p>

                              {hasCoordinates && (
                                <p className="text-[10px] font-mono text-emerald-700 mt-0.5">
                                  Coords: {order.deliveryAddress.lat.toFixed(5)}, {order.deliveryAddress.lng.toFixed(5)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* In-app Leaflet Navigation Trigger Button */}
                        <button
                          type="button"
                          onClick={() => setNavigatingOrder(order)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
                          title="Open Live In-App Navigation"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Navigate</span>
                        </button>
                      </div>

                      <div className="pt-2.5 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-gray-600 font-medium">{order.userEmail}</span>
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <span className="text-gray-500 font-normal text-[11px]">Collect Cash:</span>
                          <span className="text-emerald-700 text-sm font-black">{formatPrice(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

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

                    <button
                      onClick={(e) => handleMarkDelivered(order._id, e)}
                      disabled={updatingId === order._id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
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

        {/* Pickup Queue */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Available for Pickup at Dark Store ({availableOrders.length})
            </h2>
            <span className="text-[11px] font-semibold text-gray-500">First-come, first-served</span>
          </div>

          {availableOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center shadow-xs">
              <PackageCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">No new packed orders waiting at the dark store.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => {
                const hasCoordinates = Boolean(
                  order.deliveryAddress?.lat &&
                  order.deliveryAddress?.lng &&
                  typeof order.deliveryAddress.lat === "number" &&
                  typeof order.deliveryAddress.lng === "number"
                );

                const customerDisplayName =
                  order.customerName || order.userEmail?.split("@")[0] || "Customer";
                const customerPhoneNum =
                  order.customerPhone || order.deliveryAddress?.phone || null;

                return (
                  <div
                    key={order._id}
                    className="skiper-rider-card bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4 transition-all duration-300"
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

                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs space-y-2">
                      <div className="flex flex-wrap items-center gap-2 font-bold text-gray-900">
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200">
                          <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {customerDisplayName}
                        </span>
                        {customerPhoneNum && (
                          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {customerPhoneNum}
                          </span>
                        )}
                        {hasCoordinates && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <Crosshair className="w-3 h-3 text-emerald-600" /> GPS Doorstep
                          </span>
                        )}
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
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
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

        {/* Completed Deliveries */}
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

      {/* In-App Leaflet Navigation Modal */}
      {navigatingOrder && (
        <RiderNavigationModal
          order={navigatingOrder}
          riderPhone={riderPhone}
          onClose={() => setNavigatingOrder(null)}
          onMarkDelivered={handleMarkDelivered}
          isDelivering={updatingId === navigatingOrder._id}
        />
      )}
    </div>
  );
}