import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "admin" | "customer" | "delivery" | "staff";
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    image: { type: String },
    role: {
      type: String,
      enum: ["admin", "customer", "delivery", "staff"],
      default: "customer",
    },
    phone: { type: String },
  },
  { timestamps: true }
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);