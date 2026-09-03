"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { ProductFormValues } from "@/lib/validations/product";
import { Loader2 } from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  
  const router = useRouter();
  const [initialData, setInitialData] = useState<ProductFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setInitialData(data.data);
        } else {
          console.error("API returned failure:", data);
        }
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  const handleUpdate = async (data: ProductFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        router.push("/admin/products");
        router.refresh();
      } else {
        alert("Failed to update: " + (result.error || result.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Failed to update product", err);
      alert("Network Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="p-4 bg-white rounded-xl border border-gray-100">
        <p className="text-gray-500">Product not found for ID: {id}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-500">Update stock levels, pricing, or details</p>
      </div>
      <ProductForm initialData={initialData} onSubmit={handleUpdate} isLoading={submitting} />
    </div>
  );
}