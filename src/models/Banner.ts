import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBanner extends Document {
  badge: string;
  title: string;
  subtitle: string;
  gradient: string;
  tag: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    badge: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    gradient: { type: String, default: "from-emerald-700 via-emerald-600 to-teal-600" },
    tag: { type: String, required: true },
    code: { type: String, uppercase: true, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

if (mongoose.models.Banner) {
  delete mongoose.models.Banner;
}

export default (mongoose.models.Banner as Model<IBanner>) ||
  mongoose.model<IBanner>("Banner", BannerSchema);