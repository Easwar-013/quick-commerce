import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({ role: "customer" }).sort({ createdAt: -1 });
    const orders = await Order.find({});

    const customerData = users.map((u) => {
      const userOrders = orders.filter((o) => o.userEmail?.toLowerCase() === u.email.toLowerCase());
      const totalSpent = userOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      const latestOrder = userOrders[0];

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        totalOrders: userOrders.length,
        totalSpent,
        lastAddress: latestOrder?.deliveryAddress || null,
      };
    });

    return NextResponse.json({ success: true, data: customerData }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}