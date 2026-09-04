import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

// GET: Fetch individual order with live GPS coordinates
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update status, rider assignment, or GPS coordinates
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const {
      status,
      assignedRiderEmail,
      assignedRiderName,
      assignedRiderPhone,
      packedByEmail,
      packedByName,
      riderLocation,
    } = body;

    const updatePayload: Record<string, any> = {};

    if (status) {
      updatePayload.status = status;
    }

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
      updatePayload.packedByEmail = packedByEmail
        ? packedByEmail.toLowerCase().trim()
        : null;
    }
    if (packedByName !== undefined) {
      updatePayload.packedByName = packedByName;
    }

    if (
      riderLocation &&
      typeof riderLocation.lat === "number" &&
      typeof riderLocation.lng === "number"
    ) {
      updatePayload.riderLocation = {
        lat: riderLocation.lat,
        lng: riderLocation.lng,
        updatedAt: new Date(),
      };
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided to update" },
        { status: 400 }
      );
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