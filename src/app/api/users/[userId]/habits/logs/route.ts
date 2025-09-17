import { NextResponse } from "next/server";
import { taskLogsDb, tasksDb } from "@/lib/db";

interface Context {
  params: { userId: string };
}

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: Context) {
  const userId = Number((await params).userId);
  const { searchParams } = new URL(req.url);
  const taskIdParam = searchParams.get("taskId");
  const limitParam = searchParams.get("limit");
  const taskId = taskIdParam ? Number(taskIdParam) : undefined;
  const limit = limitParam ? Number(limitParam) : 50;
  const logs = await taskLogsDb.findMany(userId, taskId, limit);
  return NextResponse.json(logs);
}

export async function POST(req: Request, { params }: Context) {
  const userId = Number((await params).userId);
  const body = await req.json();
  const errors: string[] = [];
  if (!body?.taskId) errors.push("taskId is required");
  if (errors.length)
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });

  // Validate enums
  const statusValues = ["completed", "skipped", "failed"];
  const sourceValues = ["manual", "reminder", "import", "automation"];
  if (body.status && !statusValues.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${statusValues.join(", ")}` },
      { status: 400 },
    );
  }
  if (body.source && !sourceValues.includes(body.source)) {
    return NextResponse.json(
      { error: `Invalid source. Allowed: ${sourceValues.join(", ")}` },
      { status: 400 },
    );
  }

  const created = await taskLogsDb.create(userId, {
    taskId: Number(body.taskId),
    status: body.status,
    quantity: body.quantity ?? null,
    unit: body.unit ?? null,
    durationSeconds: body.durationSeconds ?? null,
    occurredAt: body.occurredAt ?? null,
    tz: body.tz ?? null,
    source: body.source ?? null,
    note: body.note ?? null,
    metadata: body.metadata ?? {},
  });

  // After logging a COMPLETED entry, update the task's nextExecutionDate
  try {
    if (created.status === "completed") {
      const task = await tasksDb.findUnique(Number(body.taskId));
      if (task) {
        const freqDays = parseInt(String(task.frequencyOfTask || "0"), 10);
        const occurred = new Date(created.occurredAt);
        if (
          Number.isFinite(freqDays) &&
          freqDays > 0 &&
          !isNaN(occurred.getTime())
        ) {
          const dateOnly = occurred.toLocaleDateString("en-CA");
          const [y, m, d] = dateOnly.split("-").map(Number);
          const base = new Date(y, m - 1, d);
          base.setDate(base.getDate() + freqDays);
          const nextDate = base.toLocaleDateString("en-CA");
          await tasksDb.updateDates(task.id, {
            nextExecutionDate: nextDate,
            lastExecutionDate: dateOnly,
          });
        }
      }
    }
  } catch (e) {
    console.error("Failed to bump nextExecutionDate for task", e);
  }
  return NextResponse.json(created, { status: 201 });
}
