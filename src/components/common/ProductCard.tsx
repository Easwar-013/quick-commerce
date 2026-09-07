"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { Heart, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { formatPrice } from "@/lib/utils";

export interface ProductCardProps {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  unit?: string;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
}

const digitVariants = {
  initial: (dir: number) => ({
    y: dir > 0 ? 12 : -12,
    opacity: 0,
    scale: 0.6,
  }),
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    y: dir > 0 ? -12 : 12,
    opacity: 0,
    scale: 0.6,
  }),
};

function CardStepper({
  value,
  min = 0,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
}) {
  const [direction, setDirection] = useState(0);
  const digits = value.toString().split("");

  const [prevDigits, setPrevDigits] = useState<string[]>(digits);
  const [prevTicks, setPrevTicks] = useState<number[]>([]);

  const len = digits.length;
  const lenDiff = len - prevDigits.length;

  const nextTicks = digits.map((digit, i) => {
    const prevI = i - lenDiff;
    const prevDigit = prevI >= 0 ? prevDigits[prevI] : undefined;
    const prevTick = prevI >= 0 ? prevTicks[prevI] : 0;
    return digit !== prevDigit ? (prevTick ?? 0) + 1 : (prevTick ?? 0);
  });

  if (prevDigits.join("") !== digits.join("")) {
    setPrevTicks(nextTicks);
    setPrevDigits(digits);
  }

  const handleStep = (e: React.MouseEvent, dir: number) => {
    e.stopPropagation();
    const next = Math.min(max, Math.max(min, value + dir));
    if (next === value) return;
    setDirection(dir);
    onChange(next);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center bg-emerald-600 text-white rounded-xl shadow-xs p-0.5 select-none"
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        onClick={(e) => handleStep(e, -1)}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors cursor-pointer"
        aria-label="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </motion.button>

      <div className="relative flex items-center justify-center min-w-[20px] px-1 text-xs font-black tracking-tight overflow-hidden h-5">
        {digits.map((digit, index) => (
          <div key={`${index}-${len}`} className="relative w-2.5 h-4">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.span
                key={nextTicks[index]}
                custom={direction}
                variants={digitVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 24,
                }}
                className="absolute inset-0 flex items-center justify-center tabular-nums"
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        onClick={(e) => handleStep(e, 1)}
        disabled={value >= max}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-40 cursor-pointer"
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </motion.button>
    </div>
  );
}

export default function ProductCard({
  product,
  onOpenDetails,
}: {
  product: ProductCardProps;
  onOpenDetails?: () => void;
}) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || null;

  const { items, addItem, updateQuantity } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const cardRef = useRef<HTMLDivElement>(null);

  const cartItem = items.find((item) => item._id === product._id);
  const quantity = cartItem?.quantity || 0;
  const isWishlisted = isInWishlist(product._id, userEmail);
  const isOutOfStock = product.stock <= 0 || !product.isAvailable;

  const handleAddWithAnimation = (e: React.MouseEvent) => {
    e.stopPropagation();
    gsap.fromTo(
      e.currentTarget,
      { scale: 0.8 },
      { scale: 1, duration: 0.35, ease: "elastic.out(1.2, 0.4)" }
    );

    addItem({
      _id: product._id,
      name: product.name,
      price: product.price,
      discountPrice: product.discountPrice,
      imageUrl: product.imageUrl,
      unit: product.unit || "",
      stock: product.stock,
    });
  };

  const handleStepperChange = (nextQty: number) => {
    const diff = nextQty - quantity;
    if (diff !== 0) {
      updateQuantity(product._id, diff);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    gsap.fromTo(
      e.currentTarget,
      { scale: 0.7 },
      { scale: 1, duration: 0.3, ease: "back.out(2)" }
    );
    toggleWishlist(
      {
        _id: product._id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        imageUrl: product.imageUrl,
        unit: product.unit,
        category: product.category,
        stock: product.stock,
        isAvailable: product.isAvailable,
      },
      userEmail
    );
  };

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl border border-gray-100 p-3.5 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative group h-full select-none"
    >
      {/* Wishlist Heart Button */}
      <button
        onClick={handleWishlistClick}
        aria-label="Save to Wishlist"
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-100 shadow-xs hover:scale-110 active:scale-95 transition cursor-pointer"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            isWishlisted
              ? "fill-rose-500 text-rose-500"
              : "text-gray-400 hover:text-rose-500"
          }`}
        />
      </button>

      {/* Product Details Drawer Trigger */}
      <div onClick={() => onOpenDetails && onOpenDetails()} className="cursor-pointer">
        <div className="relative w-full aspect-square rounded-xl bg-gray-50 overflow-hidden mb-2.5">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLElement).setAttribute(
                "src",
                "https://placehold.co/400x400?text=No+Image"
              );
            }}
          />
          {product.discountPrice && product.discountPrice > 0 && (
            <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
              {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Pack Unit & Stock Status */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            {product.unit || product.category}
          </span>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
              Only {product.stock} left
            </span>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mt-0.5 group-hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>
      </div>

      {/* Price & Quantity Controls */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-50">
        <div>
          <div className="text-sm font-black text-gray-900">
            {formatPrice(
              product.discountPrice && product.discountPrice > 0
                ? product.discountPrice
                : product.price
            )}
          </div>
          {product.discountPrice && product.discountPrice > 0 && (
            <div className="text-[11px] text-gray-400 line-through">
              {formatPrice(product.price)}
            </div>
          )}
        </div>

        {isOutOfStock ? (
          <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-md">
            Out of stock
          </span>
        ) : quantity === 0 ? (
          <button
            onClick={handleAddWithAnimation}
            className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            ADD
          </button>
        ) : (
          <CardStepper
            value={quantity}
            min={0}
            max={product.stock}
            onChange={handleStepperChange}
          />
        )}
      </div>
    </div>
  );
}