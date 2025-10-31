import { NextResponse } from "next/server";
import { tasksDb } from "@/lib/db";

interface Context {
  params: { userId: string };
}

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: Context) {
  const userId = Number((await params).userId);
  const url = new URL(req.url);
  const asOf = url.searchParams.get('asOf');
  
  if (asOf && /^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
    // Return only due tasks for the specified date with category info
    const tasks = await tasksDb.findDueWithCategories(userId, asOf);
    return NextResponse.json(tasks);
  } else {
    // Return all tasks with category info
    const tasks = await tasksDb.findManyWithCategories(userId);
    return NextResponse.json(tasks);
  }
}

export async function POST(req: Request, { params }: Context) {
  const userId = Number((await params).userId);
  const body = await req.json();
  const errors: string[] = [];
  if (!body?.taskName) errors.push("taskName is required");
  if (!body?.startDate) errors.push("startDate is required");
  if (
    body?.frequencyOfTask === undefined ||
    body?.frequencyOfTask === null ||
    String(body.frequencyOfTask).trim() === ""
  ) {
    errors.push("frequencyOfTask (days) is required");
  }
  if (errors.length)
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });

  // Validate enums
  const routineValues = ["anytime", "morning", "afternoon", "evening"];
  const kindValues = ["binary", "quantity", "timer"];
  if (body.routine && !routineValues.includes(body.routine)) {
    return NextResponse.json(
      { error: `Invalid routine. Allowed: ${routineValues.join(", ")}` },
      { status: 400 },
    );
  }
  if (body.kind && !kindValues.includes(body.kind)) {
    return NextResponse.json(
      { error: `Invalid kind. Allowed: ${kindValues.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate target fields if provided
  if (body.targetValue !== undefined && body.targetValue !== null) {
    const targetValue = Number(body.targetValue);
    if (isNaN(targetValue) || targetValue <= 0) {
      return NextResponse.json(
        { error: "targetValue must be a positive number" },
        { status: 400 },
      );
    }
    if (!body.targetUnit || String(body.targetUnit).trim() === "") {
      return NextResponse.json(
        { error: "targetUnit is required when targetValue is provided" },
        { status: 400 },
      );
    }
  }

  const created = await tasksDb.create(userId, {
    taskName: body.taskName,
    taskDescription: body.taskDescription ?? null,
    startDate: body.startDate,
    frequencyOfTask: String(body.frequencyOfTask),
    routine: body.routine ?? null,
    displayOrder: body.displayOrder ?? null,
    kind: body.kind ?? null,
    // Dates: initialize nextExecutionDate to startDate as requested
    lastExecutionDate: body.lastExecutionDate ?? null,
    nextExecutionDate: body.nextExecutionDate ?? body.startDate,
    // Target tracking fields
    targetValue: body.targetValue ? Number(body.targetValue) : null,
    targetUnit: body.targetUnit ?? null,
    // Category
    categoryId: body.categoryId ? Number(body.categoryId) : null,
  });
  return NextResponse.json(created, { status: 201 });
}

function computeNextExecution(
  startDate: string,
  frequencyDays: string | number,
): string | null {
  const base = new Date(startDate);
  if (isNaN(base.getTime())) return null;
  const days = parseInt(String(frequencyDays), 10);
  if (!Number.isFinite(days) || days <= 0)
    return base.toLocaleDateString("en-CA");
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}
