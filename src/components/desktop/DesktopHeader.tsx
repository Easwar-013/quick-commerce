"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  ShieldAlert,
  User,
  LogOut,
  Heart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [caretOffset, setCaretOffset] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const textTrailRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const isInitialMount = useRef(true);
  const prevCountRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Dynamically compute the smooth caret offset based on text width
  useEffect(() => {
    if (textTrailRef.current) {
      setCaretOffset(textTrailRef.current.offsetWidth);
    } else {
      setCaretOffset(0);
    }
  }, [localSearch]);

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

  useEffect(() => {
    if (!mounted || status !== "authenticated" || !userEmail) return;

    const userKey = `wishlist_login_notified_${userEmail}`;
    if (!sessionStorage.getItem(userKey)) {
      sessionStorage.setItem(userKey, "true");
      if (wishlistCount > 0) triggerBadgePopup();
    }
  }, [mounted, status, userEmail, wishlistCount]);

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
    searchInputRef.current?.focus();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="text-2xl font-black tracking-tight text-emerald-600 transition-transform group-hover:scale-105 duration-200">
            flash<span className="text-amber-500">kart</span>
          </span>
        </Link>

        {/* Skiper 56 Interactive Smooth-Caret Search & Filter Container */}
        <div className="flex-1 max-w-xl hidden md:flex items-center gap-2 relative z-20">
          <div
            onClick={() => searchInputRef.current?.focus()}
            className="relative flex-1 cursor-text group"
          >
            {/* Animated Glow Border */}
            <motion.div
              animate={{
                boxShadow: isSearchFocused
                  ? "0 0 0 2px rgba(16, 185, 129, 0.8), 0 0 20px rgba(16, 185, 129, 0.16)"
                  : "0 0 0 1px rgba(229, 231, 235, 1)",
              }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-2xl bg-gray-50/80 group-hover:bg-gray-100/60 transition-colors"
            />

            <div className="relative flex items-center px-3.5 py-2.5 z-10">
              <Search
                className={`w-4 h-4 mr-2.5 transition-colors duration-200 shrink-0 ${
                  isSearchFocused ? "text-emerald-600" : "text-gray-400"
                }`}
              />

              <div className="relative flex-1 flex items-center h-5 overflow-hidden">
                {/* Placeholder text when empty and not typed */}
                {!localSearch && (
                  <span className="absolute left-0 text-xs sm:text-sm text-gray-400 select-none pointer-events-none truncate font-medium">
                    Search for milk, drinks, snacks, fruits...
                  </span>
                )}

                {/* Invisible Real Input */}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={localSearch}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text"
                />

                {/* Visible Rendered Text Trail */}
                <div className="relative flex items-center font-mono text-xs sm:text-sm font-semibold text-gray-900 select-none pointer-events-none overflow-visible">
                  <span
                    ref={textTrailRef}
                    className="inline-block whitespace-pre font-medium text-gray-900"
                  >
                    {localSearch}
                  </span>

                  {/* Skiper 56 Spring Gliding Smooth Caret */}
                  {isSearchFocused && (
                    <motion.span
                      animate={{
                        x: caretOffset,
                        opacity: [1, 0, 1],
                      }}
                      transition={{
                        x: { type: "spring", stiffness: 500, damping: 32 },
                        opacity: { repeat: Infinity, duration: 0.85, ease: "easeInOut" },
                      }}
                      className="absolute left-0 w-[2.5px] h-4 bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                    />
                  )}
                </div>
              </div>

              {/* Clear button */}
              <AnimatePresence>
                {localSearch && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSearch();
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200/60 transition cursor-pointer z-30"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-2xl text-xs font-semibold text-gray-700 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 pointer-events-none shrink-0" />
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

          {/* Wishlist Link */}
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

          {/* Profile Badge */}
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl flex items-center gap-2 font-semibold text-xs transition shadow-sm active:scale-95"
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