"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  PackagePlus,
  ShoppingBag,
  ClipboardList,
  TicketPercent,
  Boxes,
  Users,
  Megaphone,
  Bike,
  Store,
  LogOut,
} from "lucide-react";

const navigationLinks = [
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Add Product", href: "/admin/products/new", icon: PackagePlus },
  { name: "Live Orders", href: "/admin/orders", icon: ClipboardList },
  { name: "Inventory Alerts", href: "/admin/inventory", icon: Boxes },
  { name: "Coupons", href: "/admin/coupons", icon: TicketPercent },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Banners", href: "/admin/banners", icon: Megaphone },
  { name: "Delivery App", href: "/admin/delivery", icon: Bike },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 p-4 flex flex-col justify-between shrink-0 z-30 select-none">
      <div>
        <div className="flex items-center gap-2.5 px-2 py-3 mb-6 border-b border-gray-100">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-gray-900 tracking-tight block">
              Admin Portal
            </span>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
              Store Manager
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-xs"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-gray-100 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Store className="w-4 h-4 text-gray-400" />
          Back to Store
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}