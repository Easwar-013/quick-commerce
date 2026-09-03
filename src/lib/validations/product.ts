import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional().default(""),
  price: z.number({ message: "Price must be a number" }).positive("Price must be greater than 0"),
  discountPrice: z.number().optional().nullable(),
  stock: z.number({ message: "Stock must be a number" }).int().nonnegative("Stock cannot be negative"),
  unit: z.string().optional().default(""),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().min(1, "Please select an image"),
  isAvailable: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;