"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ProductCard from "@/components/common/ProductCard";
import DesktopHeader from "@/components/desktop/DesktopHeader";
import HeroSlider from "@/components/common/HeroSlider";
import ProductDetailsDrawer from "@/components/common/ProductDetailsDrawer";
import { useFilter } from "@/context/FilterContext";
import { Loader2, Zap, ShieldCheck, Clock3, Sparkles } from "lucide-react";

export const CATEGORIES = [
  "All",
  "Fruits & Vegetables",
  "Dairy & Breakfast",
  "Snacks & Munchies",
  "Drinks",
  "Instant Food",
  "Personal Care",
  "Household Essentials",
];

export default function CustomerStorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductForDrawer, setSelectedProductForDrawer] = useState<any>(null);

  const { searchQuery, selectedCategory, setSelectedCategory, sortBy } = useFilter();
  const gridRef = useRef<HTMLDivElement>(null);

  // Guard: Redirect Staff and Delivery Partners to their respective portals
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

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) setProducts(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === "discount") {
      result.sort((a, b) => {
        const dA = a.discountPrice ? ((a.price - a.discountPrice) / a.price) * 100 : 0;
        const dB = b.discountPrice ? ((b.price - b.discountPrice) / b.price) * 100 : 0;
        return dB - dA;
      });
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  useGSAP(
    () => {
      if (!loading && filteredProducts.length > 0) {
        gsap.fromTo(
          ".gsap-product-card",
          { opacity: 0, y: 18, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.04, ease: "power2.out" }
        );
      }
    },
    { dependencies: [selectedCategory, searchQuery, sortBy, loading], scope: gridRef }
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <DesktopHeader />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <HeroSlider />

        {/* Perks Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
              <Clock3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">10-Minute Dispatch</p>
              <p className="text-[11px] text-gray-600 font-medium">Packed fresh from nearest dark store</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl shrink-0">
              <Zap className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Unbeatable Prices</p>
              <p className="text-[11px] text-gray-600 font-medium">Direct distributor warehouse deals</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 bg-teal-100 text-teal-900 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">100% Quality Assured</p>
              <p className="text-[11px] text-gray-600 font-medium">Instant doorstep refund guarantee</p>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-sm scale-105"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div ref={gridRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {selectedCategory === "All" ? "All Products" : selectedCategory}
              {searchQuery && (
                <span className="text-xs font-normal text-gray-500">
                  matching "{searchQuery}"
                </span>
              )}
            </h2>
            <span className="text-xs text-gray-500 font-semibold">
              {filteredProducts.length} items found
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
              <p className="text-sm font-bold text-gray-700">No items found matching your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredProducts.map((item) => (
                <div key={item._id} className="gsap-product-card">
                  <ProductCard
                    product={item}
                    onOpenDetails={() => setSelectedProductForDrawer(item)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Product Detail Drawer */}
      <ProductDetailsDrawer
        product={selectedProductForDrawer}
        isOpen={!!selectedProductForDrawer}
        onClose={() => setSelectedProductForDrawer(null)}
      />
    </div>
  );
}