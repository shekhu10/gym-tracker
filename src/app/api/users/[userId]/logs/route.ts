import { workoutLogDb } from "@/lib/db";

import { NextRequest, NextResponse } from "next/server";

// Map short weekday key to the corresponding JSON column on User
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

// -------- Helpers --------
const badDay = (d: string) =>
  NextResponse.json({ error: `Invalid day parameter: ${d}` }, { status: 400 });

// Return short weekday name (Mon, Tue, ...)
const currentDayName = (d: Date = new Date()): string => {
  return d.toLocaleDateString("en-US", { weekday: "short" });
};

// -------- Handlers --------

// GET /api/users/:userId/logs?date=YYYY-MM-DD&day=Mon&previousWeek=true
export async function GET(req: NextRequest, { params }: any) {
  const { userId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const dateStr = searchParams.get("date");
  const dayName = searchParams.get("day");
  const previousWeek = searchParams.get("previousWeek");

  // If requesting previous week's data
  if (previousWeek === "true" && dateStr && dayName) {
    const log = await workoutLogDb.findPreviousWeekLog(
      Number(userId),
      dayName,
      dateStr,
    );
    return NextResponse.json(log);
  }

  const logs = await workoutLogDb.findMany(
    Number(userId),
    dayName || undefined,
  );
  return NextResponse.json(logs);
}

// POST /api/users/:userId/logs
// Body: { dayKey: 'mon', entries: [...], date?: 'YYYY-MM-DD' }
export async function POST(req: NextRequest, { params }: any) {
  const { userId } = await params;
  console.log("POST /api/users/[userId]/logs - userId:", userId);

  const body = await req.json();
  console.log("Request body:", JSON.stringify(body, null, 2));

  const { dayKey, exercises, date, workoutDay, startTime, endTime, notes } =
    body as {
      dayKey: DayKey;
      exercises: unknown;
      date?: string;
      workoutDay?: string;
      startTime?: string;
      endTime?: string;
      notes?: string;
    };
  console.log(
    "Parsed - dayKey:",
    dayKey,
    "exercises:",
    !!exercises,
    "date:",
    date,
  );

  if (!dayKey || !(dayKey in dayToColumn)) {
    console.log(
      "Invalid dayKey:",
      dayKey,
      "Valid keys:",
      Object.keys(dayToColumn),
    );
    return badDay(dayKey as string);
  }
  if (!exercises) {
    console.log("Missing exercises in request body");
    return NextResponse.json({ error: "exercises missing" }, { status: 400 });
  }

  // For now, we'll skip plan validation since we're migrating away from Prisma
  // You can add plan validation later if needed

  // Determine log date (defaults to today)
  let logDate: Date;
  if (date) {
    // Create date in local timezone to avoid timezone issues
    // This ensures the selected date remains the same regardless of server timezone
    const [year, month, day] = date.split('-').map(Number);
    logDate = new Date(year, month - 1, day); // month is 0-indexed
    if (isNaN(logDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format, expected YYYY-MM-DD" },
        { status: 400 },
      );
    }
  } else {
    logDate = new Date();
  }

  const log = await workoutLogDb.create(
    Number(userId),
    currentDayName(logDate),
    workoutDay || "",
    {
      exercises,
      startTime,
      endTime,
      notes,
    },
    logDate,
  );
  return NextResponse.json(log, { status: 201 });
}
