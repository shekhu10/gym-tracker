import { userDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Map URL param (mon,tue,...) to column name in DB
const dayToColumn = {
  mon: "monPlan",
  tue: "tuePlan",
  wed: "wedPlan",
  thu: "thuPlan",
  fri: "friPlan",
  sat: "satPlan",
  sun: "sunPlan",
} as const;

type DayKey = keyof typeof dayToColumn;

function badDay(day: string) {
  return NextResponse.json({ error: "Invalid day parameter" }, { status: 400 });
}

export async function GET(_req: NextRequest, { params }: any) {
  const { userId, day } = await params;
  const col = dayToColumn[day as DayKey];
  if (!col) return badDay(day);
  const user = await userDb.findDayPlan(Number(userId), col);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user.plan);
}

export async function PUT(req: NextRequest, { params }: any) {
  const { userId, day } = await params;
  const col = dayToColumn[day as DayKey];
  if (!col) return badDay(day);

  const body = await req.json();
  // You may add validation here
  const updated = await userDb.updateDayPlan(Number(userId), col, body);
  if (!updated)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(updated.plan);
}

export async function DELETE(_req: NextRequest, { params }: any) {
  const { userId, day } = await params;
  const col = dayToColumn[day as DayKey];
  if (!col) return badDay(day);

  const cleared = await userDb.clearDayPlan(Number(userId), col);
  if (!cleared)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
