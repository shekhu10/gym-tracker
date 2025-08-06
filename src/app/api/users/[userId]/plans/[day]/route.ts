import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Map URL param (mon,tue,...) to column name in DB
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

function badDay(day: string) {
  return NextResponse.json({ error: 'Invalid day parameter' }, { status: 400 })
}

export async function GET(
  _req: NextRequest,
  { params }: any,
) {
  const { userId, day } = await params
  const col = dayToColumn[day as DayKey]
  if (!col) return badDay(day)
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { [col]: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json(user[col as keyof typeof user])
}

export async function PUT(
  req: NextRequest,
  { params }: any,
) {
  const { userId, day } = await params
  const col = dayToColumn[day as DayKey]
  if (!col) return badDay(day)

  const body = await req.json()
  // You may add validation here
  const updated = await prisma.user.update({
    where: { id: Number(userId) },
    data: { [col]: body },
    select: { [col]: true },
  })
  return NextResponse.json(updated[col as keyof typeof updated])
}

export async function DELETE(
  _req: NextRequest,
  { params }: any,
) {
  const { userId, day } = await params
  const col = dayToColumn[day as DayKey]
  if (!col) return badDay(day)

  await prisma.user.update({
    where: { id: Number(userId) },
    data: { [col]: null },
  })
  return NextResponse.json({ success: true })
}
