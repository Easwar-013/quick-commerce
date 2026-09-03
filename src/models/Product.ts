import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  unit?: string;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: [true, "Please provide a product name"] },
    description: { type: String, default: "" },
    price: { type: Number, required: [true, "Please provide a price"] },
    discountPrice: { type: Number },
    stock: { type: Number, required: true, default: 0 },
    unit: { type: String, default: "" },
    category: { type: String, required: [true, "Please provide a category"] },
    imageUrl: { type: String, required: [true, "Please provide an image"] },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Delete the old compiled model from mongoose cache if it exists
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

export default (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);