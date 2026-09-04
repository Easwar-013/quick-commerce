"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Package,
  PlusCircle,
  ClipboardList,
  AlertTriangle,
  Ticket,
  Users,
  Image as ImageIcon,
  Bike,
  Store,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Add Product", href: "/admin/products/new", icon: PlusCircle },
  { label: "Live Orders", href: "/admin/orders", icon: ClipboardList },
  { label: "Inventory Alerts", href: "/admin/inventory", icon: AlertTriangle },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Banners", href: "/admin/banners", icon: ImageIcon },
  { label: "Delivery Staff", href: "/admin/delivery", icon: Bike },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = () => (
    <div className="flex flex-col justify-between h-full py-5 px-4">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 tracking-tight">Admin Portal</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Store Manager
            </p>
          </div>
        </div>

        {/* Links */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-emerald-600" : "text-gray-400"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="space-y-1 pt-4 border-t border-gray-100">
        <Link
          href="/"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Store className="w-4 h-4 text-gray-400" />
          <span>Back to Store</span>
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Top App Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-gray-900">Admin Portal</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200"
          />
          <div className="relative w-64 max-w-[80vw] h-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <NavLinks />
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 shrink-0 sticky top-0 h-screen overflow-y-auto">
        <NavLinks />
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 w-full overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}