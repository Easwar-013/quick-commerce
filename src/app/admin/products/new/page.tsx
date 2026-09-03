"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { ProductFormValues } from "@/lib/validations/product";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        router.push("/admin/products");
        router.refresh();
      } else {
        alert("Failed to create product: " + (result.error || result.message || "Server Error"));
      }
    } catch (err: any) {
      console.error("Failed to create product", err);
      alert("Network Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
        <p className="text-sm text-gray-500">Fill in product details to publish to the store feed</p>
      </div>
      <ProductForm onSubmit={handleCreate} isLoading={loading} />
    </div>
  );
}