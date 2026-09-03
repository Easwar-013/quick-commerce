import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  unit?: string;
  category: string;
  stock: number;
  isAvailable: boolean;
}

interface WishlistStore {
  // Map of userEmail -> items array
  userWishlists: Record<string, WishlistItem[]>;
  getUserItems: (userEmail?: string | null) => WishlistItem[];
  toggleWishlist: (item: WishlistItem, userEmail?: string | null) => void;
  isInWishlist: (id: string, userEmail?: string | null) => boolean;
  clearWishlist: (userEmail?: string | null) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      userWishlists: {},

      getUserItems: (userEmail) => {
        const key = userEmail?.toLowerCase() || "guest";
        return get().userWishlists[key] || [];
      },

      toggleWishlist: (item, userEmail) => {
        const key = userEmail?.toLowerCase() || "guest";
        const currentItems = get().userWishlists[key] || [];
        const exists = currentItems.some((i) => i._id === item._id);

        const updatedItems = exists
          ? currentItems.filter((i) => i._id !== item._id)
          : [...currentItems, item];

        set({
          userWishlists: {
            ...get().userWishlists,
            [key]: updatedItems,
          },
        });
      },

      isInWishlist: (id, userEmail) => {
        const key = userEmail?.toLowerCase() || "guest";
        const items = get().userWishlists[key] || [];
        return items.some((i) => i._id === id);
      },

      clearWishlist: (userEmail) => {
        const key = userEmail?.toLowerCase() || "guest";
        set({
          userWishlists: {
            ...get().userWishlists,
            [key]: [],
          },
        });
      },
    }),
    {
      name: "flashkart-user-wishlists",
    }
  )
);