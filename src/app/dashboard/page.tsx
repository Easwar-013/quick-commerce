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
import { SkiperSmoothInput } from "@/components/ui/skiper-input";
import {
  Package,
  MapPin,
  CheckCircle2,
  Bike,
  ChevronRight,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  X,
  RotateCcw,
  Heart,
  Clock,
  Sparkles,
  Phone,
  UserCheck,
  Store,
  Navigation,
  Smartphone,
  MessageSquare,
  Maximize2,
  Pencil,
  Building2,
  Hash,
  Crosshair,
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
  lat?: number;
  lng?: number;
}

// Interactive Touch/Tap Map with Address Search & Reverse Geocoding
function LocationPickerMap({
  lat,
  lng,
  onChange,
  onAddressDetected,
}: {
  lat: number;
  lng: number;
  street?: string;
  city?: string;
  pincode?: string;
  onChange: (coords: { lat: number; lng: number }) => void;
  onAddressDetected?: (addr: { street?: string; city?: string; pincode?: string }) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Reverse geocode coordinates back to address inputs
  const fetchAddressFromCoords = async (latitude: number, longitude: number) => {
    if (!onAddressDetected) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await res.json();
      if (data?.address) {
        const detectedCity =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.suburb ||
          "";
        const detectedPincode = data.address.postcode || "";
        const detectedStreet = [
          data.address.road,
          data.address.neighbourhood,
          data.address.residential,
        ]
          .filter(Boolean)
          .join(", ");

        onAddressDetected({
          street: detectedStreet || undefined,
          city: detectedCity || undefined,
          pincode: detectedPincode || undefined,
        });
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initPicker() {
      if (!mapContainerRef.current || leafletMapRef.current) return;
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "picker-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
            <div style="width: 36px; height: 36px; background: #059669; border-radius: 12px 12px 2px 12px; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 18px rgba(5,150,105,0.45); border: 2.5px solid #ffffff;">
              <svg style="transform: rotate(-45deg); width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div style="width: 8px; height: 8px; background: #064e3b; border-radius: 50%; margin-top: 4px; opacity: 0.4;"></div>
          </div>
        `,
        iconSize: [36, 46],
        iconAnchor: [18, 42],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChange({ lat: pos.lat, lng: pos.lng });
        fetchAddressFromCoords(pos.lat, pos.lng);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        fetchAddressFromCoords(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      leafletMapRef.current = map;
    }

    initPicker();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && leafletMapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      leafletMapRef.current.setView([lat, lng], leafletMapRef.current.getZoom() || 16);
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-gray-200 mt-2 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Top Helper Badge */}
      <div className="absolute top-2.5 left-2.5 z-[1000] bg-black/75 backdrop-blur-xs text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl pointer-events-none shadow-md flex items-center gap-1.5 border border-white/10">
        <Crosshair className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
        <span>Tap anywhere or drag the pin to your exact delivery location</span>
      </div>

      {/* Bottom Floating Tip */}
      <div className="absolute bottom-2.5 inset-x-3 z-[1000] bg-white/90 backdrop-blur-md text-emerald-800 text-[10px] font-bold py-1 px-2.5 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between pointer-events-none">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
          Move the pin directly over your house or building
        </span>
        <span className="font-mono text-[9px] text-gray-500 font-normal">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
}

// In-app Real-time Geospatial Map Canvas with Road-Snapping Routing & Custom Biker Marker
function RealtimeTrackingCanvas({
  riderLocation,
  destLat,
  destLng,
  riderName,
  onRouteStats,
  onDestinationChange,
}: {
  riderLocation: { lat: number; lng: number };
  destLat: number;
  destLng: number;
  riderName?: string;
  onRouteStats?: (stats: { distanceKm: string; durationMins: string }) => void;
  onDestinationChange?: (coords: { lat: number; lng: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [(riderLocation.lat + destLat) / 2, (riderLocation.lng + destLng) / 2],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Red Destination Home Pin
      const destIcon = L.divIcon({
        className: "dest-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 38px; height: 38px; background: #e11d48; border-radius: 12px 12px 2px 12px; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 18px rgba(225,29,72,0.4); border: 2.5px solid #ffffff;">
              <svg style="transform: rotate(-45deg); width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div style="width: 8px; height: 8px; background: #9f1239; border-radius: 50%; margin-top: 4px; opacity: 0.4;"></div>
          </div>
        `,
        iconSize: [38, 48],
        iconAnchor: [19, 44],
      });
      const destMarker = L.marker([destLat, destLng], { icon: destIcon, draggable: true }).addTo(map);
      destMarkerRef.current = destMarker;

      destMarker.on("dragend", () => {
        const pos = destMarker.getLatLng();
        if (onDestinationChange) onDestinationChange({ lat: pos.lat, lng: pos.lng });
      });

      map.on("click", (e: any) => {
        destMarker.setLatLng(e.latlng);
        if (onDestinationChange) onDestinationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      // Quick-Commerce Delivery Rider Bike Pin
      const bikerIcon = L.divIcon({
        className: "custom-biker-icon",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="position: absolute; top: 2px; width: 44px; height: 44px; background: rgba(147, 51, 234, 0.28); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 42px; height: 42px; background: #9333ea; border-radius: 14px; border: 2.5px solid #ffffff; box-shadow: 0 10px 20px rgba(147, 51, 234, 0.45); display: flex; align-items: center; justify-content: center; z-index: 10;">
              <svg style="width: 22px; height: 22px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <circle cx="15" cy="5" r="1"/>
                <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
              </svg>
            </div>
            <div style="background: #1e1b4b; color: #ffffff; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); white-space: nowrap; margin-top: 4px; border: 1px solid rgba(255,255,255,0.2); z-index: 10;">
              ${riderName ? riderName.split(" ")[0] : "Rider"}
            </div>
          </div>
        `,
        iconSize: [44, 60],
        iconAnchor: [22, 30],
      });
      const riderMarker = L.marker([riderLocation.lat, riderLocation.lng], { icon: bikerIcon }).addTo(map);
      riderMarkerRef.current = riderMarker;

      // Turn-by-turn road route via OSRM
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${riderLocation.lng},${riderLocation.lat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const routeData = await res.json();

        if (routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];
          const latLngs = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

          const polyline = L.polyline(latLngs, {
            color: "#0284c7",
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          routeLineRef.current = polyline;
          map.fitBounds(polyline.getBounds(), { padding: [55, 55] });

          if (onRouteStats) {
            const distanceKm = (route.distance / 1000).toFixed(1) + " km";
            const durationMins = Math.max(1, Math.ceil(route.duration / 60)) + " mins";
            onRouteStats({ distanceKm, durationMins });
          }
        }
      } catch {
        const polyline = L.polyline(
          [
            [riderLocation.lat, riderLocation.lng],
            [destLat, destLng],
          ],
          { color: "#0284c7", weight: 4, dashArray: "6, 8" }
        ).addTo(map);
        routeLineRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      mapRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update routing and markers when positions change
  useEffect(() => {
    if (!mapRef.current) return;

    if (riderMarkerRef.current && riderLocation?.lat && riderLocation?.lng) {
      riderMarkerRef.current.setLatLng([riderLocation.lat, riderLocation.lng]);
    }

    if (destMarkerRef.current && destLat && destLng) {
      destMarkerRef.current.setLatLng([destLat, destLng]);
    }

    if (riderLocation?.lat && riderLocation?.lng && destLat && destLng) {
      fetch(
        `https://router.project-osrm.org/route/v1/driving/${riderLocation.lng},${riderLocation.lat};${destLng},${destLat}?overview=full&geometries=geojson`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.routes && data.routes.length > 0 && routeLineRef.current) {
            const latLngs = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            routeLineRef.current.setLatLngs(latLngs);

            if (onRouteStats) {
              const distanceKm = (data.routes[0].distance / 1000).toFixed(1) + " km";
              const durationMins = Math.max(1, Math.ceil(data.routes[0].duration / 60)) + " mins";
              onRouteStats({ distanceKm, durationMins });
            }
          }
        })
        .catch(() => {});
    }
  }, [riderLocation?.lat, riderLocation?.lng, destLat, destLng]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// Live Dispatch Modal with Rooftop Coordinate Priority
function LiveOrderMapModal({
  order,
  onClose,
}: {
  order: any;
  onClose: () => void;
}) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeStats, setRouteStats] = useState({ distanceKm: "Calculating...", durationMins: "Calculating..." });

  useEffect(() => {
    const addr = currentOrder.deliveryAddress;
    if (!addr) return;

    // Prioritize direct coordinates saved by the customer
    if (
      addr.lat &&
      addr.lng &&
      typeof addr.lat === "number" &&
      typeof addr.lng === "number" &&
      addr.lat >= 8.0 &&
      addr.lat <= 14.0 &&
      addr.lng >= 76.0 &&
      addr.lng <= 81.0
    ) {
      setDestinationCoords({ lat: addr.lat, lng: addr.lng });
      return;
    }

    async function geocodeDestination() {
      const cleanCity = addr.city?.trim() || "Nagapattinam";
      const cleanPincode = addr.pincode?.trim() || "";
      const cleanStreet = addr.street?.trim() || "";

      try {
        const query = cleanPincode
          ? `${cleanPincode}, ${cleanCity}, Tamil Nadu, India`
          : `${cleanStreet}, ${cleanCity}, Tamil Nadu, India`;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const pLat = parseFloat(data[0].lat);
          const pLon = parseFloat(data[0].lon);
          if (pLat >= 8.0 && pLat <= 14.0 && pLon >= 76.0 && pLon <= 81.0) {
            setDestinationCoords({ lat: pLat, lng: pLon });
            return;
          }
        }
      } catch (err) {
        console.warn("Geocoding address failed:", err);
      }

      setDestinationCoords({ lat: 10.7656, lng: 79.8428 });
    }

    geocodeDestination();
  }, [
    currentOrder.deliveryAddress?.lat,
    currentOrder.deliveryAddress?.lng,
    currentOrder.deliveryAddress?.city,
    currentOrder.deliveryAddress?.pincode,
  ]);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/orders/${order._id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.data) {
          setCurrentOrder(data.data);
        }
      } catch (err) {
        console.error("Failed to poll live order:", err);
      }
    };

    const interval = setInterval(fetchLatest, 2000);
    return () => clearInterval(interval);
  }, [order._id]);

  const handleUpdateDestination = async (newCoords: { lat: number; lng: number }) => {
    setDestinationCoords(newCoords);
    try {
      await fetch(`/api/orders/${currentOrder._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryAddress: {
            ...currentOrder.deliveryAddress,
            lat: newCoords.lat,
            lng: newCoords.lng,
          },
        }),
      });
    } catch (err) {
      console.warn("Failed to persist relocated doorstep coordinates:", err);
    }
  };

  const isOutForDelivery = currentOrder.status === "OUT_FOR_DELIVERY";
  const hasRider = Boolean(currentOrder.assignedRiderEmail || currentOrder.assignedRiderName);
  const isPickedUp = isOutForDelivery && hasRider;

  const hasLiveGps =
    currentOrder.riderLocation &&
    typeof currentOrder.riderLocation.lat === "number" &&
    typeof currentOrder.riderLocation.lng === "number";

  const riderName = currentOrder.assignedRiderName || "Express Partner";
  const riderPhone = currentOrder.assignedRiderPhone || null;
  const customerName = currentOrder.customerName || "Customer";
  const destination = `${currentOrder.deliveryAddress?.street || ""}, ${currentOrder.deliveryAddress?.city || ""}`;
  const addressQuery = encodeURIComponent(destination);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] max-w-sm sm:max-w-md w-full h-[90vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden relative font-sans">
        {/* Header */}
        <div className="bg-white px-5 pt-4 pb-3 border-b border-gray-100 z-20 space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-1 -ml-1 text-gray-700 hover:text-gray-900 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h3 className="font-extrabold text-gray-900 text-sm tracking-tight">
                On the way to delivery
              </h3>
              <p className="text-[11px] font-semibold text-gray-400">
                #{currentOrder.orderNumber}
              </p>
            </div>
            <div className="w-5" />
          </div>

          <div className="flex items-start justify-between pt-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>{customerName}</span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium max-w-[210px] leading-tight truncate">
                {destination}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Details
            </a>
          </div>
        </div>

        {/* State 1: Awaiting Rider Pickup */}
        {!isPickedUp ? (
          <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 bg-amber-100 rounded-3xl border-2 border-amber-300 flex items-center justify-center text-amber-700 shadow-md">
                <Store className="w-9 h-9" />
              </div>
              <span className="animate-ping absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400" />
            </div>

            <div className="max-w-xs">
              <h4 className="text-base font-black text-gray-900">Rider hasn't picked up yet</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Your order is currently being packed at the dark store. Live GPS tracking will begin as soon as a delivery partner accepts the order.
              </p>
            </div>

            <div className="bg-white px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-amber-800 flex items-center gap-2 shadow-2xs">
              <Clock className="w-4 h-4 animate-spin text-amber-600" />
              <span>Packing • Dispatching soon</span>
            </div>
          </div>
        ) : !hasLiveGps || !destinationCoords ? (
          /* State 2: Acquiring GPS */
          <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <div>
              <h4 className="text-sm font-bold text-gray-800">Acquiring Rider Live Location...</h4>
              <p className="text-xs text-gray-500 mt-1">Connecting to partner's GPS navigation feed.</p>
            </div>
          </div>
        ) : (
          /* State 3: Active Road Snapped Map */
          <div className="relative flex-1 overflow-hidden flex flex-col">
            <div className="relative flex-1 w-full h-full">
              <RealtimeTrackingCanvas
                riderLocation={currentOrder.riderLocation}
                destLat={destinationCoords.lat}
                destLng={destinationCoords.lng}
                riderName={riderName}
                onRouteStats={setRouteStats}
                onDestinationChange={handleUpdateDestination}
              />

              <div className="absolute top-4 right-4 flex items-center gap-2.5 z-[1000]">
                {riderPhone && (
                  <a
                    href={`sms:${riderPhone}`}
                    className="w-11 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </a>
                )}
                {riderPhone ? (
                  <a
                    href={`tel:${riderPhone}`}
                    className="w-11 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="bg-white p-5 rounded-t-[32px] border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-20 space-y-4">
              <div className="flex items-center justify-around px-2">
                <div className="text-center">
                  <span className="text-sm font-black text-gray-900 block">{routeStats.distanceKm}</span>
                  <span className="text-[11px] font-semibold text-gray-400">Distance</span>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:scale-105 transition"
                    title="Open Navigation"
                  >
                    <Navigation className="w-5 h-5 text-emerald-600" />
                  </a>
                </div>

                <div className="text-center">
                  <span className="text-sm font-black text-gray-900 block">{routeStats.durationMins}</span>
                  <span className="text-[11px] font-semibold text-gray-400">Timer</span>
                </div>
              </div>

              <div className="w-full bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20">
                <Bike className="w-4 h-4 animate-bounce" />
                <span>Rider {riderName} is En Route</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addItem } = useCartStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const addAddressPrompt = searchParams.get("addAddress") === "true";

  const [activeTab, setActiveTab] = useState<"orders" | "addresses">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);

  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newType, setNewType] = useState<"HOME" | "WORK" | "OTHER">("HOME");
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number }>({
    lat: 10.7656,
    lng: 79.8428,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const ordersListRef = useRef<HTMLDivElement>(null);

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
      if (addAddressPrompt) handleOpenAddAddress();
    }
  }, [tabParam, addAddressPrompt]);

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

  useGSAP(
    () => {
      gsap.from(".skiper-fade-down", {
        opacity: 0,
        y: -16,
        duration: 0.5,
        ease: "power3.out",
      });
      gsap.from(".skiper-sidebar", {
        opacity: 0,
        x: -24,
        duration: 0.45,
        ease: "power2.out",
        delay: 0.08,
      });
    },
    { scope: containerRef }
  );

  useGSAP(
    () => {
      if (!loading && orders.length > 0) {
        gsap.fromTo(
          ".skiper-card",
          { opacity: 0, y: 16, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.38,
            stagger: 0.05,
            ease: "power2.out",
          }
        );
      }
    },
    { dependencies: [activeTab, loading, orders.length], scope: ordersListRef }
  );

  const handleOrderAgain = (order: any, e: React.MouseEvent) => {
    gsap.fromTo(
      e.currentTarget,
      { scale: 0.9 },
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
    }, 450);
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setNewContactName(session?.user?.name || displayName || "");
    setNewPhone("");
    setNewStreet("");
    setNewCity("");
    setNewPincode("");
    setNewType("HOME");
    setPickedCoords({ lat: 10.7656, lng: 79.8428 });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: AddressItem) => {
    setEditingAddressId(addr.id);
    setNewContactName(addr.contactName || displayName);
    setNewPhone(addr.phone || "");
    setNewStreet(addr.street || "");
    setNewCity(addr.city || "");
    setNewPincode(addr.pincode || "");
    setNewType(addr.type || "HOME");
    setPickedCoords({
      lat: addr.lat || 10.7656,
      lng: addr.lng || 79.8428,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet || !newCity || !newPincode || !displayEmail || !newPhone) return;

    if (editingAddressId) {
      const updated = addresses.map((a) =>
        a.id === editingAddressId
          ? {
              ...a,
              type: newType,
              contactName: newContactName.trim() || displayName,
              phone: newPhone.trim(),
              street: newStreet.trim(),
              city: newCity.trim(),
              pincode: newPincode.trim(),
              lat: pickedCoords.lat,
              lng: pickedCoords.lng,
            }
          : a
      );
      setAddresses(updated);
      localStorage.setItem(`flashkart_addresses_${displayEmail}`, JSON.stringify(updated));
    } else {
      const newEntry: AddressItem = {
        id: Date.now().toString(),
        type: newType,
        contactName: newContactName.trim() || displayName,
        phone: newPhone.trim(),
        street: newStreet.trim(),
        city: newCity.trim(),
        pincode: newPincode.trim(),
        isDefault: addresses.length === 0,
        lat: pickedCoords.lat,
        lng: pickedCoords.lng,
      };

      const updated = [...addresses, newEntry];
      setAddresses(updated);
      localStorage.setItem(`flashkart_addresses_${displayEmail}`, JSON.stringify(updated));
    }

    setEditingAddressId(null);
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

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 pb-24">
      <DesktopHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-5">
          <Link href="/" className="hover:text-emerald-600 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" /> Back to Store
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">My Account</span>
        </div>

        {/* Profile Card */}
        <div className="skiper-fade-down bg-white rounded-3xl border border-gray-200/90 p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md">
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
              <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                {displayName}
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{displayEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/wishlist"
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 border border-rose-200 transition-all duration-200 active:scale-95 shadow-xs"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> Wishlist Shelf
            </Link>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Customer
            </span>
          </div>
        </div>

        {/* Sidebar & Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <aside className="skiper-sidebar md:col-span-1 space-y-2 sticky top-20 z-20">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 translate-x-1"
                  : "bg-white text-gray-700 hover:bg-gray-100/80 border border-gray-200"
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
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 translate-x-1"
                  : "bg-white text-gray-700 hover:bg-gray-100/80 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses ({addresses.length})</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-80" />
            </button>
          </aside>

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

                    return (
                      <div
                        key={order._id}
                        className="skiper-card bg-white rounded-3xl border border-gray-200/90 p-5 shadow-xs space-y-4 transition-all duration-300 hover:shadow-md"
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
                          <div className="bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                                <Bike className="w-5 h-5 animate-pulse" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                                  Delivery Partner in Transit
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                                  </span>
                                </h4>
                                <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                                  {order.assignedRiderName
                                    ? `${order.assignedRiderName} is heading towards your location.`
                                    : "Dark store is packing. Awaiting rider assignment."}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setTrackingOrder(order)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md hover:shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Track Your Order</span>
                              <Maximize2 className="w-3 h-3 ml-1 opacity-70" />
                            </button>
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
                          <div className="text-gray-600 flex flex-wrap items-center gap-2 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                              </span>
                            </span>

                            {order.deliveryAddress?.phone && (
                              <span className="inline-flex items-center gap-1 text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md font-semibold font-mono">
                                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{order.deliveryAddress.phone}</span>
                              </span>
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
                      Pin your doorstep on the map so riders arrive directly at your location.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddAddress}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center shadow-xs">
                    <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-800 font-bold text-sm">No saved delivery addresses</p>
                    <button
                      onClick={handleOpenAddAddress}
                      className="inline-block mt-4 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-xs"
                    >
                      Add Address Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-white p-4 rounded-2xl border relative shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
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

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditAddress(addr)}
                                title="Edit address"
                                className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                title="Delete address"
                                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-2 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{addr.contactName || displayName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{addr.phone || "No phone added"}</span>
                            </div>
                          </div>

                          <p className="text-xs font-bold text-gray-900 leading-relaxed">{addr.street}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {addr.city} - {addr.pincode}
                          </p>

                          {addr.lat && addr.lng && (
                            <div className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Crosshair className="w-3 h-3" />
                              <span>GPS Doorstep Pinned ({addr.lat.toFixed(4)}, {addr.lng.toFixed(4)})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add / Edit Address Modal with Interactive Map Touch-To-Pin */}
                {isAddressModalOpen && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3.5">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-sm tracking-tight">
                            {editingAddressId ? "Edit Delivery Location" : "Add Delivery Location"}
                          </h3>
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                            Pinpoint your exact doorstep on the map below.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsAddressModalOpen(false)}
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveAddress} className="space-y-3.5">
                        {/* Interactive Touch Map */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                              Pinpoint Your Exact Location
                            </label>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {pickedCoords.lat.toFixed(4)}, {pickedCoords.lng.toFixed(4)}
                            </span>
                          </div>
                          <LocationPickerMap
                            lat={pickedCoords.lat}
                            lng={pickedCoords.lng}
                            onChange={(coords) => setPickedCoords(coords)}
                            onAddressDetected={(detected) => {
                              if (detected.city && !newCity) setNewCity(detected.city);
                              if (detected.pincode && !newPincode) setNewPincode(detected.pincode);
                              if (detected.street && !newStreet) setNewStreet(detected.street);
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                          <SkiperSmoothInput
                            label="Receiver Name"
                            icon={<UserCheck className="w-4 h-4" />}
                            value={newContactName}
                            onChange={(val) => setNewContactName(val)}
                            required
                          />

                          <SkiperSmoothInput
                            label="Mobile Number"
                            icon={<Smartphone className="w-4 h-4" />}
                            value={newPhone}
                            onChange={(val) => setNewPhone(val)}
                            required
                          />
                        </div>

                        {/* Address Type Selector */}
                        <div className="relative">
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                            Address Type
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["HOME", "WORK", "OTHER"] as const).map((typeOption) => (
                              <button
                                key={typeOption}
                                type="button"
                                onClick={() => setNewType(typeOption)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                                  newType === typeOption
                                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {typeOption}
                              </button>
                            ))}
                          </div>
                        </div>

                        <SkiperSmoothInput
                          label="Street / Flat / Door No"
                          icon={<MapPin className="w-4 h-4" />}
                          value={newStreet}
                          onChange={(val) => setNewStreet(val)}
                          required
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <SkiperSmoothInput
                            label="City / Town"
                            icon={<Building2 className="w-4 h-4" />}
                            value={newCity}
                            onChange={(val) => setNewCity(val)}
                            required
                          />

                          <SkiperSmoothInput
                            label="Pincode"
                            icon={<Hash className="w-4 h-4" />}
                            value={newPincode}
                            onChange={(val) => setNewPincode(val)}
                            required
                          />
                        </div>

                        <div className="flex gap-2.5 pt-3">
                          <button
                            type="button"
                            onClick={() => setIsAddressModalOpen(false)}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold cursor-pointer shadow-md hover:shadow-emerald-600/30 transition-all active:scale-95"
                          >
                            {editingAddressId ? "Update Address" : "Save Address"}
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

      {/* Real-time Map Modal */}
      {trackingOrder && (
        <LiveOrderMapModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}
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