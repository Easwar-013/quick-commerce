import React from "react";
import dbConnect from "@/lib/db";
import Product, { IProduct } from "@/models/Product";
import ProductCard from "@/components/common/ProductCard";
import DesktopHeader from "@/components/desktop/DesktopHeader";

export const dynamic = "force-dynamic";

async function getProducts() {
  await dbConnect();
  const products = await Product.find({ isAvailable: true }).sort({ createdAt: -1 });
  return JSON.parse(JSON.stringify(products));
}

export default async function CustomerStorePage() {
  const products: IProduct[] = await getProducts();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <DesktopHeader />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">10-Minute Delivery</h1>
          <p className="text-xs md:text-sm text-gray-500">Fresh groceries and essentials delivered fast</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <h3 className="text-gray-700 font-semibold">No products available yet</h3>
            <p className="text-gray-400 text-sm mt-1">Visit the Admin panel to add your first grocery items.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {products.map((item: any) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}