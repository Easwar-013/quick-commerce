import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const {
      status,
      assignedRiderEmail,
      assignedRiderName,
      assignedRiderPhone,
      packedByEmail,
      packedByName,
    } = await request.json();

    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { status };

    if (assignedRiderEmail !== undefined) {
      updatePayload.assignedRiderEmail = assignedRiderEmail
        ? assignedRiderEmail.toLowerCase().trim()
        : null;
    }
    if (assignedRiderName !== undefined) {
      updatePayload.assignedRiderName = assignedRiderName;
    }
    if (assignedRiderPhone !== undefined) {
      updatePayload.assignedRiderPhone = assignedRiderPhone;
    }
    if (packedByEmail !== undefined) {
      updatePayload.packedByEmail = packedByEmail ? packedByEmail.toLowerCase().trim() : null;
    }
    if (packedByName !== undefined) {
      updatePayload.packedByName = packedByName;
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updatePayload, { new: true });

    if (!updatedOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}