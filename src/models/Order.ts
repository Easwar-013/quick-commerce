import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  unit?: string;
}

export interface IRiderLocation {
  lat: number;
  lng: number;
  updatedAt?: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  userEmail: string;
  customerName?: string;
  customerPhone?: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: "CONFIRMED" | "PACKING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  assignedRiderEmail?: string | null;
  assignedRiderName?: string | null;
  assignedRiderPhone?: string | null;
  riderLocation?: IRiderLocation | null;
  packedByEmail?: string | null;
  packedByName?: string | null;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
    type: string;
    phone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true, lowercase: true },
    customerName: { type: String, default: "Customer" },
    customerPhone: { type: String, default: "" },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        imageUrl: { type: String, required: true },
        unit: { type: String },
      },
    ],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["CONFIRMED", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
      default: "CONFIRMED",
    },
    assignedRiderEmail: { type: String, lowercase: true, default: null },
    assignedRiderName: { type: String, default: null },
    assignedRiderPhone: { type: String, default: null },
    riderLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    packedByEmail: { type: String, lowercase: true, default: null },
    packedByName: { type: String, default: null },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      type: { type: String, default: "HOME" },
      phone: { type: String },
    },
  },
  { timestamps: true }
);

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);