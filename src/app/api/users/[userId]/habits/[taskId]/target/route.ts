import { NextResponse } from "next/server";
import { tasksDb } from "@/lib/db";

interface Context {
  params: { userId: string; taskId: string };
}

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: Context) {
  const { userId, taskId } = await params;
  const body = await req.json();
  const errors: string[] = [];

  if (!body?.targetValue) errors.push("targetValue is required");
  if (!body?.targetUnit) errors.push("targetUnit is required");

  if (errors.length)
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });

  // Validate targetValue
  const targetValue = Number(body.targetValue);
  if (isNaN(targetValue) || targetValue <= 0) {
    return NextResponse.json(
      { error: "targetValue must be a positive number" },
      { status: 400 },
    );
  }

  // Verify the task exists and belongs to the user
  const task = await tasksDb.findUnique(Number(taskId));
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (task.userId !== Number(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Archive current target and set new one
  const updated = await tasksDb.archiveCurrentTargetAndSetNew(
    Number(taskId),
    targetValue,
    String(body.targetUnit),
  );

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to update target" },
      { status: 500 },
    );
  }

  return NextResponse.json(updated, { status: 200 });
}

