"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Search, ShieldAlert, User, LogOut, Heart, SlidersHorizontal, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useFilter } from "@/context/FilterContext";
import { formatPrice } from "@/lib/utils";
import gsap from "gsap";

export default function DesktopHeader() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { getTotalCount, getTotalPrice } = useCartStore();
  const { getUserItems } = useWishlistStore();
  const { searchQuery, setSearchQuery, sortBy, setSortBy } = useFilter();

  const [mounted, setMounted] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || "");
  const [showBadge, setShowBadge] = useState(false);
  const [imgError, setImgError] = useState(false);

  const badgeRef = useRef<HTMLSpanElement>(null);
  const isInitialMount = useRef(true);
  const prevCountRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const userEmail = session?.user?.email || null;
  const userRole = (session?.user as any)?.role || "customer";
  const userWishlist = mounted ? getUserItems(userEmail) : [];
  const wishlistCount = userWishlist.length;
  const totalCount = mounted ? getTotalCount() : 0;
  const totalPrice = mounted ? getTotalPrice() : 0;

  const isAdmin = userRole === "admin";
  const displayName = session?.user?.name || "Account";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Role-based destination for the profile badge
  const profileHref =
    userRole === "staff"
      ? "/staff"
      : userRole === "delivery"
      ? "/delivery"
      : userRole === "admin"
      ? "/admin/products"
      : "/dashboard";

  const triggerBadgePopup = () => {
    setShowBadge(true);
    setTimeout(() => {
      if (badgeRef.current) {
        gsap.killTweensOf(badgeRef.current);
        gsap.timeline({
          onComplete: () => setShowBadge(false),
        })
          .fromTo(
            badgeRef.current,
            { scale: 0, opacity: 0, y: -4 },
            { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" }
          )
          .to(badgeRef.current, {
            opacity: 0,
            scale: 0.5,
            duration: 0.5,
            delay: 3.0,
            ease: "power2.inOut",
          });
      }
    }, 20);
  };

  // One-time popup notification upon login per account session
  useEffect(() => {
    if (!mounted || status !== "authenticated" || !userEmail) return;

    const userKey = `wishlist_login_notified_${userEmail}`;
    if (!sessionStorage.getItem(userKey)) {
      sessionStorage.setItem(userKey, "true");
      if (wishlistCount > 0) {
        triggerBadgePopup();
      }
    }
  }, [mounted, status, userEmail, wishlistCount]);

  // Trigger only on explicit add / remove actions
  useEffect(() => {
    if (!mounted) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevCountRef.current = wishlistCount;
      return;
    }

    if (prevCountRef.current !== wishlistCount) {
      prevCountRef.current = wishlistCount;
      if (wishlistCount > 0) {
        triggerBadgePopup();
      } else {
        setShowBadge(false);
      }
    }
  }, [wishlistCount, mounted]);

  const handleLogout = () => {
    if (userEmail) {
      sessionStorage.removeItem(`wishlist_login_notified_${userEmail}`);
    }
    signOut({ callbackUrl: "/login" });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    setSearchQuery(val);
    if (window.location.pathname !== "/") {
      router.push("/");
    }
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-black tracking-tight text-emerald-600">
            flash<span className="text-amber-500">kart</span>
          </span>
        </Link>

        {/* Global Search & Sort */}
        <div className="flex-1 max-w-xl hidden md:flex items-center gap-2 relative z-20">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for milk, drinks, snacks, fruits..."
              value={localSearch}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-400"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Top Discount</option>
            </select>
          </div>
        </div>

        {/* User Navigation & Actions */}
        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-gray-700 hover:text-emerald-600 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/60"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Admin
            </Link>
          )}

          {/* Wishlist Link (only relevant for customers) */}
          {userRole === "customer" && (
            <Link
              href="/wishlist"
              className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-rose-600 hover:bg-rose-50/40 transition relative"
              title="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {showBadge && wishlistCount > 0 && (
                <span
                  ref={badgeRef}
                  className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs pointer-events-none"
                >
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}

          {/* User Account / Google Avatar Profile (Points to role's portal) */}
          {session?.user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href={profileHref}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-emerald-300 bg-gray-50/50 transition-colors"
                title={`Go to ${userRole === "staff" ? "Dark Store Station" : userRole === "delivery" ? "Rider App" : "Account"}`}
              >
                {session.user.image && !imgError ? (
                  <img
                    src={session.user.image}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-6 h-6 rounded-full object-cover border border-emerald-500"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-300">
                    {userInitials || "U"}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-gray-800 hidden sm:inline max-w-[100px] truncate leading-tight">
                    {displayName}
                  </span>
                  {userRole !== "customer" && (
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider leading-none">
                      {userRole}
                    </span>
                  )}
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 border border-gray-200 rounded-xl transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold text-gray-700 hover:text-emerald-600 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200"
            >
              <User className="w-4 h-4 text-emerald-600" />
              Sign In
            </Link>
          )}

          {/* Cart Trigger */}
          {userRole === "customer" && (
            <Link
              href="/cart"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl flex items-center gap-2 font-semibold text-xs transition shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{totalCount} items</span>
              {totalCount > 0 && <span>• {formatPrice(totalPrice)}</span>}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}