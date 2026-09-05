"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RealtimeOrderMapProps {
  riderLocation?: { lat: number; lng: number } | null;
  deliveryAddress: { street: string; city: string; pincode?: string };
}

export default function RealtimeOrderMap({
  riderLocation,
  deliveryAddress,
}: RealtimeOrderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Fallback anchor: Default dark store / hub location
  const defaultHubLat = 10.7656;
  const defaultHubLng = 79.8428;

  // Active rider location or default starting location
  const currentRiderLat = riderLocation?.lat ?? defaultHubLat;
  const currentRiderLng = riderLocation?.lng ?? defaultHubLng;

  // Customer destination point offset slightly along the road network
  const destLat = currentRiderLat + 0.0082;
  const destLng = currentRiderLng + 0.0075;

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Light CartoDB Positron tiles for the clean minimal look in your reference
    const map = L.map(mapContainerRef.current, {
      center: [currentRiderLat, currentRiderLng],
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    // Destination Pin (Red teardrop icon with user symbol)
    const destinationIcon = L.divIcon({
      className: "custom-dest-pin",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 38px; height: 38px; background: #e11d48; border-radius: 12px 12px 2px 12px; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(225,29,72,0.35); border: 2px solid #ffffff;">
            <svg style="transform: rotate(-45deg); width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div style="width: 8px; height: 8px; background: #9f1239; border-radius: 50%; margin-top: 4px; opacity: 0.5;"></div>
        </div>
      `,
      iconSize: [38, 48],
      iconAnchor: [19, 44],
    });

    L.marker([destLat, destLng], { icon: destinationIcon }).addTo(map);

    // Live Rider Pulsing Blue Dot with Halo (matches reference design)
    const riderDotIcon = L.divIcon({
      className: "custom-rider-dot",
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background: rgba(56, 189, 248, 0.35); border-radius: 50%; animation: pulse 2s infinite;"></div>
          <div style="width: 18px; height: 18px; background: #0284c7; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.25);"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const riderMarker = L.marker([currentRiderLat, currentRiderLng], {
      icon: riderDotIcon,
    }).addTo(map);
    riderMarkerRef.current = riderMarker;

    // Smooth curved road polyline connecting live rider to doorstep
    const midPointLat = (currentRiderLat + destLat) / 2 + 0.0015;
    const midPointLng = (currentRiderLng + destLng) / 2 - 0.002;

    const routePolyline = L.polyline(
      [
        [currentRiderLat, currentRiderLng],
        [midPointLat, midPointLng],
        [destLat, destLng],
      ],
      {
        color: "#38bdf8",
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }
    ).addTo(map);
    routeLineRef.current = routePolyline;

    map.fitBounds(routePolyline.getBounds(), { padding: [60, 60] });
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update actual marker position as fresh coordinates stream in from rider
  useEffect(() => {
    if (!mapInstanceRef.current || !riderMarkerRef.current) return;
    if (riderLocation?.lat && riderLocation?.lng) {
      const newLatLng: L.LatLngExpression = [riderLocation.lat, riderLocation.lng];
      riderMarkerRef.current.setLatLng(newLatLng);

      if (routeLineRef.current) {
        const currentPoints = routeLineRef.current.getLatLngs() as L.LatLng[];
        if (currentPoints.length >= 2) {
          routeLineRef.current.setLatLngs([newLatLng, currentPoints[1], [destLat, destLng]]);
        }
      }
    }
  }, [riderLocation?.lat, riderLocation?.lng, destLat, destLng]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}