import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Banner from "@/models/Banner";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const deleted = await Banner.findByIdAndDelete(id);
    return NextResponse.json({ success: true, data: deleted }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}