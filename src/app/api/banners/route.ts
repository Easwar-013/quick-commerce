import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Banner from "@/models/Banner";

export async function GET() {
  try {
    await dbConnect();
    const banners = await Banner.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: banners }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const banner = await Banner.create(body);
    return NextResponse.json({ success: true, data: banner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}