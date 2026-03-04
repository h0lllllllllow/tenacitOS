import { NextRequest, NextResponse } from "next/server";
import { getDemoActivityState, setDemoActivityEnabled } from "@/lib/demo-activity";

export async function GET() {
  return NextResponse.json(getDemoActivityState());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const enabled = Boolean(body?.enabled);
    const state = setDemoActivityEnabled(enabled);
    return NextResponse.json(state);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
