import { workoutLogDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// -------- Handlers --------

export async function GET(_req: NextRequest, { params }: any) {
  const { userId, logId } = await params;
  const log = await workoutLogDb.findUnique(Number(logId));
  if (log && log.userId !== Number(userId)) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }
  if (!log) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }
  return NextResponse.json(log);
}

export async function PUT(req: NextRequest, { params }: any) {
  const { userId, logId } = await params;
  const body = await req.json();
  const { entries } = body as { entries: unknown };
  if (!entries) {
    return NextResponse.json({ error: "entries missing" }, { status: 400 });
  }
  const updated = await workoutLogDb.update(Number(logId), { entries });
  if (!updated || updated.userId !== Number(userId)) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: any) {
  const { userId, logId } = await params;
  const deleted = await workoutLogDb.delete(Number(logId));
  if (!deleted) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
