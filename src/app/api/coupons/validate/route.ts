import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Coupon from "@/models/Coupon";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { code, orderAmount } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, error: "Please provide a coupon code" }, { status: 400 });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return NextResponse.json({ success: false, error: "Invalid or expired coupon code" }, { status: 404 });
    }

    if (orderAmount < coupon.minOrderValue) {
      return NextResponse.json(
        { success: false, error: `Minimum order value for this coupon is ₹${coupon.minOrderValue}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          code: coupon.code,
          discountPercentage: coupon.discountPercentage,
          minOrderValue: coupon.minOrderValue,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}