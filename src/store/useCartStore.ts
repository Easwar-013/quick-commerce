import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  unit: string;
  quantity: number;
  stock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((item) => item._id === product._id);

        if (existing) {
          if (existing.quantity >= product.stock) return;
          set({
            items: items.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item._id !== id) });
      },

      updateQuantity: (id, delta) => {
        const items = get().items;
        set({
          items: items
            .map((item) => {
              if (item._id === id) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null;
                if (newQty > item.stock) return item;
                return { ...item, quantity: newQty };
              }
              return item;
            })
            .filter(Boolean) as CartItem[],
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const activePrice = item.discountPrice || item.price;
          return total + activePrice * item.quantity;
        }, 0);
      },
    }),
    {
      name: "quick-commerce-cart",
    }
  )
);