import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// -------- Handlers --------

export async function GET(
    _req: NextRequest,
    {params}: any
) {
  const { userId, logId } = params
  const log = await prisma.workoutLog.findFirst({
    where: {
      id: Number(logId),
      userId: Number(userId),
    },
  })
  if (!log) {
    return NextResponse.json({ error: 'Log not found' }, { status: 404 })
  }
  return NextResponse.json(log)
}

export async function PUT(
    req: NextRequest,
    {params}: any
) {
  const { userId, logId } = params
  const body = await req.json()
  const { entries } = body as { entries: unknown }
  if (!entries) {
    return NextResponse.json({ error: 'entries missing' }, { status: 400 })
  }
  const updated = await prisma.workoutLog.update({
    where: {
      id: Number(logId),
      userId: Number(userId),
    },
    data: { entries },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
    _req: NextRequest,
     { params }: any
) {
  const { userId, logId } = params
  await prisma.workoutLog.delete({
    where: {
      id: Number(logId),
      userId: Number(userId),
    },
  })
  return NextResponse.json({ success: true })
}
