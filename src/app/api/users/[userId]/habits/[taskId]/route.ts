import { NextResponse } from "next/server";
import { tasksDb } from "@/lib/db";

interface Context {
  params: { userId: string; taskId: string };
}

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: Context) {
  const taskId = Number((await params).taskId);
  const body = await req.json();
  const updated = await tasksDb.update(taskId, body ?? {});
  if (!updated) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Context) {
  const taskId = Number((await params).taskId);
  const deleted = await tasksDb.delete(taskId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deleted);
}


