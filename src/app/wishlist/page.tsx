"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, Trash2, ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import ProductCard from "@/components/common/ProductCard";
import DesktopHeader from "@/components/desktop/DesktopHeader";

export default function WishlistPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || null;

  const { getUserItems, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = mounted ? getUserItems(userEmail) : [];

  const handleAddAllToCart = () => {
    items.forEach((p) => {
      if (p.isAvailable && p.stock > 0) {
        addItem({
          _id: p._id,
          name: p.name,
          price: p.price,
          discountPrice: p.discountPrice,
          imageUrl: p.imageUrl,
          unit: p.unit || "",
          stock: p.stock,
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <DesktopHeader />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Prominent Back to Store Button matching the Cart Page */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" /> Back to Store Feed
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              My Saved Favorites ({items.length})
            </h1>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddAllToCart}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Add All to Cart
              </button>
              <button
                onClick={() => clearWishlist(userEmail)}
                className="border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600 text-gray-600 text-xs font-semibold px-3 py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-xs">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-800">Your wishlist is empty</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Click the heart icon on your favorite daily groceries, drinks, and snacks to bookmark them here.
            </p>
            <Link
              href="/"
              className="inline-block mt-5 bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-4">
            {items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}