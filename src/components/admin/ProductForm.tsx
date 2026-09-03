"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/lib/validations/product";
import { Loader2, UploadCloud, X, Percent } from "lucide-react";

interface ProductFormProps {
  initialData?: Partial<ProductFormValues> & { _id?: string };
  onSubmit: (data: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
}

export const CATEGORIES = [
  "Fruits & Vegetables",
  "Dairy & Breakfast",
  "Snacks & Munchies",
  "Drinks",
  "Beverages",
  "Instant Food",
  "Personal Care",
  "Household Essentials",
];

export default function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  // Calculate initial discount percentage if editing an existing product
  const getInitialDiscountPercent = () => {
    if (initialData?.price && initialData?.discountPrice && initialData.discountPrice > 0 && initialData.discountPrice < initialData.price) {
      return Math.round(((initialData.price - initialData.discountPrice) / initialData.price) * 100);
    }
    return 0;
  };

  const [discountPercent, setDiscountPercent] = useState<number>(getInitialDiscountPercent());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      discountPrice: initialData?.discountPrice || 0,
      stock: initialData?.stock ?? 10,
      unit: initialData?.unit || "",
      category: initialData?.category || CATEGORIES[0],
      imageUrl: initialData?.imageUrl || "",
      isAvailable: initialData?.isAvailable ?? true,
    },
  });

  const previewImage = watch("imageUrl");
  const currentPrice = watch("price") || 0;

  // Compute the final price in real-time
  const computedFinalPrice =
    discountPercent > 0 && discountPercent < 100
      ? Math.round(currentPrice - (currentPrice * discountPercent) / 100)
      : currentPrice;

  // Keep the underlying discountPrice synced with the selected percentage
  useEffect(() => {
    if (discountPercent > 0 && discountPercent < 100 && currentPrice > 0) {
      const discounted = Math.round(currentPrice - (currentPrice * discountPercent) / 100);
      setValue("discountPrice", discounted);
    } else {
      setValue("discountPrice", 0);
    }
  }, [discountPercent, currentPrice, setValue]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("imageUrl", reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setValue("imageUrl", "", { shouldValidate: true });
  };

  const onFormSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    const calculatedDiscountPrice =
      discountPercent > 0 && discountPercent < 100 && values.price > 0
        ? Math.round(values.price - (values.price * discountPercent) / 100)
        : 0;

    await onSubmit({
      ...values,
      discountPrice: calculatedDiscountPrice,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            {...register("name")}
            type="text"
            placeholder="e.g. Coca Cola"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none border-gray-300 text-gray-900"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Description (Optional) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-xs text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Brief details on source, weight, or shelf life..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none border-gray-300 text-gray-900"
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            {...register("category")}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none border-gray-300 bg-white text-gray-900"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>

        {/* Unit / Pack Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit / Pack Size <span className="text-xs text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            {...register("unit")}
            type="text"
            placeholder="e.g., 750ml, 1L, 1 can"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none border-gray-300 text-gray-900"
          />
        </div>

        {/* Original Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
          <input
            {...register("price", { valueAsNumber: true })}
            type="number"
            min="0"
            step="1"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none border-gray-300 text-gray-900"
          />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>

        {/* Discount Percentage Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
            {discountPercent > 0 && currentPrice > 0 && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Final Price: ₹{computedFinalPrice}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="99"
              value={discountPercent === 0 ? "" : discountPercent}
              onChange={(e) => {
                const val = Math.min(99, Math.max(0, Number(e.target.value) || 0));
                setDiscountPercent(val);
              }}
              placeholder="0 (No discount)"
              className="w-full pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none border-gray-300 text-gray-900"
            />
            <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Units</label>
          <input
            {...register("stock", { valueAsNumber: true })}
            type="number"
            min="0"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none border-gray-300 text-gray-900"
          />
          {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="isAvailable"
            {...register("isAvailable")}
            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
          />
          <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700 cursor-pointer">
            Available for Delivery
          </label>
        </div>

        {/* Image File Upload */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>

          {previewImage ? (
            <div className="relative w-36 h-36 border rounded-xl overflow-hidden group">
              <img src={previewImage} alt="Product" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-emerald-50/30 transition-colors">
              <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Click to upload product image</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
          {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : initialData ? (
          "Update Product"
        ) : (
          "Create Product"
        )}
      </button>
    </form>
  );
}