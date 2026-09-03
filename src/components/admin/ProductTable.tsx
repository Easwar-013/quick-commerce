"use client";

import React from "react";
import Link from "next/link";
import { Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface AdminProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  unit?: string;
  imageUrl: string;
  isAvailable: boolean;
}

interface ProductTableProps {
  products: AdminProduct[];
  onDelete: (id: string) => void;
  isDeleting?: string | null;
}

export default function ProductTable({ products, onDelete, isDeleting }: ProductTableProps) {
  if (!products.length) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <p className="text-gray-500">No products found in the catalog.</p>
        <Link
          href="/admin/products/new"
          className="inline-block mt-3 text-sm text-emerald-600 font-semibold hover:underline"
        >
          Add your first product &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-gray-600 font-medium">
            <th className="py-3.5 px-4">Item</th>
            <th className="py-3.5 px-4">Category</th>
            <th className="py-3.5 px-4">Price</th>
            <th className="py-3.5 px-4">Stock</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((item) => (
            <tr key={item._id} className="hover:bg-gray-50/75 transition-colors">
              <td className="py-3 px-4 flex items-center gap-3">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-10 h-10 object-cover rounded-md border bg-gray-50 flex-shrink-0"
                />
                <div>
                  <div className="font-semibold text-gray-900">{item.name}</div>
                  {item.unit && item.unit.trim() !== "" && (
                    <div className="text-xs text-gray-500">{item.unit}</div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-gray-600">{item.category}</td>
              <td className="py-3 px-4 font-medium text-gray-900">
                {item.discountPrice ? (
                  <div>
                    <span className="text-emerald-700">{formatPrice(item.discountPrice)}</span>
                    <span className="text-xs text-gray-400 line-through ml-1.5">{formatPrice(item.price)}</span>
                  </div>
                ) : (
                  formatPrice(item.price)
                )}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    item.stock === 0
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : item.stock < 5
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {item.stock} in stock
                </span>
              </td>
              <td className="py-3 px-4">
                {item.isAvailable ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium">
                    <XCircle className="w-3.5 h-3.5" /> Inactive
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/products/${item._id}/edit`}
                    className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => onDelete(item._id)}
                    disabled={isDeleting === item._id}
                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}