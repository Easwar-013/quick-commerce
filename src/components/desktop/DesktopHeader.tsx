"use client";

import React, { useEffect, useState, useRef } from "react";
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
  ChevronDown,
  X,
  Clock,
  Check,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useFilter } from "@/context/FilterContext";
import { formatPrice } from "@/lib/utils";
import { SkiperSmoothInput } from "@/components/ui/skiper-input";

const SORT_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "discount", label: "Top Discount" },
];

const RECENT_SEARCHES_KEY = "flashkart_recent_searches";

export default function DesktopHeader() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { getTotalCount, getTotalPrice } = useCartStore();
  const { getUserItems } = useWishlistStore();
  const { searchQuery, setSearchQuery, sortBy, setSortBy } = useFilter();

  const [mounted, setMounted] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || "");
  const [imgError, setImgError] = useState(false);
  const [showWishlistBadge, setShowWishlistBadge] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDesktopSortOpen, setIsDesktopSortOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const desktopSortRef = useRef<HTMLDivElement>(null);
  const mobileSortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      setRecentSearches([]);
    }
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

  // Trigger heart badge popup ONLY once per login session
  useEffect(() => {
    if (!mounted || status !== "authenticated" || !userEmail) return;

    const sessionKey = `flashkart_wishlist_notified_${userEmail}`;
    const alreadyNotified = sessionStorage.getItem(sessionKey);

    if (!alreadyNotified && wishlistCount > 0) {
      sessionStorage.setItem(sessionKey, "true");
      setShowWishlistBadge(true);

      // Smoothly disappear after 3.5 seconds
      const timer = setTimeout(() => {
        setShowWishlistBadge(false);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [mounted, status, userEmail, wishlistCount]);

  // Click outside to close dropdowns & recent searches panel
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (desktopSortRef.current && !desktopSortRef.current.contains(target)) {
        setIsDesktopSortOpen(false);
      }
      if (mobileSortRef.current && !mobileSortRef.current.contains(target)) {
        setIsMobileSortOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (query: string) => {
    const clean = query.trim();
    if (!clean || clean.length < 2) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSelectRecentSearch = (query: string) => {
    setLocalSearch(query);
    setSearchQuery(query);
    saveRecentSearch(query);
    setIsSearchFocused(false);
    if (window.location.pathname !== "/") {
      router.push("/");
    }
  };

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(val);
      if (window.location.pathname !== "/") {
        router.push("/");
      }
    }, 120);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && localSearch.trim()) {
      saveRecentSearch(localSearch);
      setSearchQuery(localSearch);
      setIsSearchFocused(false);
      if (window.location.pathname !== "/") {
        router.push("/");
      }
    }
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    setSearchQuery("");
  };

  const handleLogout = () => {
    if (userEmail) {
      sessionStorage.removeItem(`flashkart_wishlist_notified_${userEmail}`);
    }
    signOut({ callbackUrl: "/login" });
  };

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

  const activeSortLabel =
    SORT_OPTIONS.find((opt) => opt.id === sortBy)?.label || "Default";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <span className="text-2xl font-black tracking-tight text-emerald-600 transition-transform group-hover:scale-105 duration-200">
              flash<span className="text-amber-500">kart</span>
            </span>
          </Link>

          {/* Desktop Search & Filter */}
          <div
            ref={searchContainerRef}
            className="flex-1 max-w-xl hidden md:flex items-center gap-2 relative z-20"
          >
            <div className="relative flex-1">
              <div onFocus={() => setIsSearchFocused(true)}>
                <SkiperSmoothInput
                  placeholder="Search for milk, drinks, snacks, fruits..."
                  icon={<Search className="w-4 h-4" />}
                  value={localSearch}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer z-30"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Recent Searches Panel */}
              <AnimatePresence>
                {isSearchFocused && !localSearch && recentSearches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-14 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl p-3 z-50"
                  >
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRecentSearches([]);
                          localStorage.removeItem(RECENT_SEARCHES_KEY);
                        }}
                        className="text-[10px] font-semibold text-gray-400 hover:text-red-600 transition cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((item) => (
                        <div
                          key={item}
                          onClick={() => handleSelectRecentSearch(item)}
                          className="bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={(e) => removeRecentSearch(item, e)}
                            className="text-gray-400 hover:text-red-500 rounded-full p-0.5 hover:bg-gray-200/60 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Sort Dropdown */}
            <div ref={desktopSortRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsDesktopSortOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all border shadow-2xs cursor-pointer ${
                  isDesktopSortOpen || sortBy !== "default"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50/80"
                }`}
              >
                <SlidersHorizontal
                  className={`w-3.5 h-3.5 ${
                    isDesktopSortOpen || sortBy !== "default"
                      ? "text-emerald-600"
                      : "text-gray-500"
                  }`}
                />
                <span>{activeSortLabel}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                    isDesktopSortOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isDesktopSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute right-0 top-13 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 overflow-hidden font-sans"
                  >
                    <div className="px-3.5 py-1.5 border-b border-gray-100 mb-1">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        Sort Products
                      </p>
                    </div>
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id);
                          setIsDesktopSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-left transition-colors cursor-pointer ${
                          sortBy === opt.id
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {isAdmin && (
              <Link
                href="/admin/products"
                className="text-xs font-semibold text-gray-700 hover:text-emerald-600 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/60"
              >
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Admin
              </Link>
            )}

            {/* Wishlist Link with Smooth Disappearing Notification Badge */}
            {userRole === "customer" && (
              <Link
                href="/wishlist"
                className="p-2 sm:p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-rose-600 hover:bg-rose-50/40 transition relative"
                title="Wishlist"
              >
                <Heart className="w-4 h-4" />
                <AnimatePresence>
                  {showWishlistBadge && wishlistCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0, y: -4 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{
                        scale: 0,
                        opacity: 0,
                        transition: { duration: 0.4, ease: "easeInOut" },
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs pointer-events-none"
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}

            {session?.user ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Link
                  href={profileHref}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-gray-200 hover:border-emerald-300 bg-gray-50/50 transition-colors"
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

            {userRole === "customer" && (
              <Link
                href="/cart"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-3.5 py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 font-semibold text-xs transition shadow-sm active:scale-95 shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{totalCount} items</span>
                {totalCount > 0 && <span className="hidden sm:inline">• {formatPrice(totalPrice)}</span>}
              </Link>
            )}
          </div>
        </div>

        {/* Dedicated Mobile Search & Filter */}
        <div className="md:hidden pb-3 pt-1 flex items-center gap-2 relative z-30">
          <div className="relative flex-1">
            <div onFocus={() => setIsSearchFocused(true)}>
              <SkiperSmoothInput
                placeholder="Search milk, snacks, drinks..."
                icon={<Search className="w-4 h-4" />}
                value={localSearch}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 z-30 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Mobile Recent Searches */}
            <AnimatePresence>
              {isSearchFocused && !localSearch && recentSearches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-14 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl p-3 z-50"
                >
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" /> Recent
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem(RECENT_SEARCHES_KEY);
                      }}
                      className="text-[10px] font-semibold text-gray-400 hover:text-red-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((item) => (
                      <div
                        key={item}
                        onClick={() => handleSelectRecentSearch(item)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(item, e)}
                          className="text-gray-400 p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Styled Mobile Sort Button */}
          <div ref={mobileSortRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMobileSortOpen((prev) => !prev)}
              aria-label="Sort options"
              className={`flex items-center justify-center rounded-2xl w-12 h-12 border transition-all shadow-2xs active:scale-95 cursor-pointer ${
                isMobileSortOpen || sortBy !== "default"
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-600/25"
                  : "bg-white border-gray-200 text-gray-700 hover:border-emerald-500 hover:bg-emerald-50/40"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {isMobileSortOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 top-14 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
                >
                  <div className="px-3.5 py-1.5 border-b border-gray-100 mb-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      Sort Products By
                    </p>
                  </div>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsMobileSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-left transition-colors cursor-pointer ${
                        sortBy === opt.id
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}