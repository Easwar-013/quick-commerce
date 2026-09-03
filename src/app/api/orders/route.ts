import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    // Filter by user email if provided
    const filter = userEmail ? { userEmail: userEmail.toLowerCase() } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.userEmail) {
      return NextResponse.json(
        { success: false, error: "User must be logged in to place an order." },
        { status: 401 }
      );
    }

    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = await Order.create({
      ...body,
      userEmail: body.userEmail.toLowerCase(),
      orderNumber,
      status: "CONFIRMED",
      estimatedDeliveryTime: "10 mins",
    });

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error("POST Order Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}