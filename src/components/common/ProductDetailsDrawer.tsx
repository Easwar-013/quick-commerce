"use client";

import React, { useState, useEffect } from "react";
import { X, Star, MessageSquarePlus, Loader2, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useSession } from "next-auth/react";

interface DrawerProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailsDrawer({ product, isOpen, onClose }: DrawerProps) {
  const { data: session } = useSession();
  const { addItem } = useCartStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && product?._id) {
      setLoading(true);
      fetch(`/api/reviews?productId=${product._id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setReviews(d.data);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      alert("Please sign in to write a product review.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          userName: session.user.name || "Verified Buyer",
          userEmail: session.user.email,
          rating,
          comment,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setReviews([d.data, ...reviews]);
        setComment("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              {product.category}
            </span>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image & Product Info */}
          <div className="mt-4 flex gap-4 items-center">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-24 h-24 object-cover rounded-2xl border border-gray-100 bg-gray-50 shrink-0"
            />
            <div>
              <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
              {product.unit && <p className="text-xs text-gray-400 mt-0.5">{product.unit}</p>}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {avgRating} ({reviews.length} reviews)
                </div>
                <div className="text-base font-black text-gray-900">
                  {formatPrice(product.discountPrice || product.price)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 my-4 py-3 border-y border-gray-100 text-[11px] text-gray-600">
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-600" /> 10-Min Fast Delivery</div>
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Quality Checked</div>
          </div>

          {/* Customer Reviews Section */}
          <div className="mt-6 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <MessageSquarePlus className="w-4 h-4 text-emerald-600" /> Ratings & Customer Reviews
            </h3>

            {/* Post Review Form */}
            <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-0.5 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                required
                placeholder="Write your product review..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Submit Review"}
              </button>

              {success && (
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Review submitted!
                </p>
              )}
            </form>

            {/* Reviews Stream */}
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto py-4" />
            ) : reviews.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {reviews.map((r) => (
                  <div key={r._id} className="p-3 bg-white rounded-xl border border-gray-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{r.userName}</span>
                      <div className="flex text-amber-400">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-[11px]">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add to Cart Footer */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              addItem({
                _id: product._id,
                name: product.name,
                price: product.price,
                discountPrice: product.discountPrice,
                imageUrl: product.imageUrl,
                unit: product.unit || "",
                stock: product.stock,
              });
              onClose();
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm"
          >
            Add to Cart • {formatPrice(product.discountPrice || product.price)}
          </button>
        </div>
      </div>
    </div>
  );
}