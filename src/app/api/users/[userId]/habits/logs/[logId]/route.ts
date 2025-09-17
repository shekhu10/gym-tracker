import { NextResponse } from "next/server";
import { taskLogsDb } from "@/lib/db";

interface Context {
  params: { userId: string; logId: string };
}

export const dynamic = "force-dynamic";

export async function DELETE(_: Request, { params }: Context) {
  const id = Number((await params).logId);
  const deleted = await taskLogsDb.delete(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deleted);
}


