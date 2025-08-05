import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Map short weekday key to the corresponding JSON column on User
const dayToColumn = {
  mon: 'monPlan',
  tue: 'tuePlan',
  wed: 'wedPlan',
  thu: 'thuPlan',
  fri: 'friPlan',
  sat: 'satPlan',
  sun: 'sunPlan',
} as const

type DayKey = keyof typeof dayToColumn

// -------- Helpers --------
const badDay = (d: string) =>
  NextResponse.json({ error: `Invalid day parameter: ${d}` }, { status: 400 })

// Return short weekday name (Mon, Tue, ...)
const currentDayName = (d: Date = new Date()): string => {
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

// -------- Handlers --------

// GET /api/users/:userId/logs?date=YYYY-MM-DD&day=Mon
export async function GET(req: NextRequest, context: { params: { userId: string } }) {
  const { userId } = await context.params
  const searchParams = req.nextUrl.searchParams
  const dateStr = searchParams.get('date')
  const dayName = searchParams.get('day')

  const where: any = { userId: Number(userId) }
  if (dateStr) {
    // filter same calendar date (ignore time)
    const date = new Date(dateStr + 'T00:00:00')
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)
    where.date = { gte: date, lt: nextDate }
  }
  if (dayName) where.dayName = dayName

  const logs = await prisma.workoutLog.findMany({ where, orderBy: { date: 'desc' } })
  return NextResponse.json(logs)
}

// POST /api/users/:userId/logs
// Body: { dayKey: 'mon', entries: [...], date?: 'YYYY-MM-DD' }
export async function POST(req: NextRequest, context: { params: { userId: string } }) {
  const { userId } = context.params
  const body = await req.json()
  const { dayKey, entries, date } = body as { dayKey: DayKey; entries: unknown; date?: string }

  if (!dayKey || !(dayKey in dayToColumn)) return badDay(dayKey as string)
  if (!entries) return NextResponse.json({ error: 'entries missing' }, { status: 400 })

  const col = dayToColumn[dayKey]
  const user = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { [col]: true } })
  const plan = user?.[col as keyof typeof user] as any | null
  if (!plan) return NextResponse.json({ error: `No plan found for ${dayKey}` }, { status: 404 })

  // Determine log date (defaults to today)
  let logDate: Date
  if (date) {
    logDate = new Date(date + 'T00:00:00')
    if (isNaN(logDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format, expected YYYY-MM-DD' }, { status: 400 })
    }
  } else {
    logDate = new Date()
  }

  const log = await prisma.workoutLog.create({
    data: {
      userId: Number(userId),
      date: logDate,
      dayName: currentDayName(logDate),
      planName: plan.workoutDay ?? '',
      entries,
    },
  })
  return NextResponse.json(log, { status: 201 })
}
