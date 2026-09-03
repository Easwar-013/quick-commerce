"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Heart, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { getTotalCount } = useCartStore();
  const { getUserItems } = useWishlistStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide the customer bottom navigation bar on rider, store staff, and admin pages
  if (
    pathname?.startsWith("/delivery") ||
    pathname?.startsWith("/staff") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }

  const userEmail = session?.user?.email || null;
  const userWishlist = mounted ? getUserItems(userEmail) : [];
  const wishlistCount = userWishlist.length;
  const totalCount = mounted ? getTotalCount() : 0;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between shadow-lg">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
          pathname === "/" ? "text-emerald-600" : "text-gray-500"
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Store</span>
      </Link>

      <Link
        href="/wishlist"
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold relative ${
          pathname === "/wishlist" ? "text-emerald-600" : "text-gray-500"
        }`}
      >
        <div className="relative">
          <Heart className="w-5 h-5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </div>
        <span>Wishlist</span>
      </Link>

      <Link
        href="/cart"
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold relative ${
          pathname === "/cart" ? "text-emerald-600" : "text-gray-500"
        }`}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-emerald-600 text-white rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center">
              {totalCount}
            </span>
          )}
        </div>
        <span>Cart</span>
      </Link>

      <Link
        href="/dashboard"
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
          pathname === "/dashboard" ? "text-emerald-600" : "text-gray-500"
        }`}
      >
        <User className="w-5 h-5" />
        <span>Account</span>
      </Link>
    </nav>
  );
}