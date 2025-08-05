import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/users  -> list all users
export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } })
  return NextResponse.json(users)
}

// POST /api/users  -> create a new user
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email } = body as { name?: string; email?: string }

  if (!name || !email) {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
  }

  try {
    const user = await prisma.user.create({ data: { name, email } })
    return NextResponse.json(user, { status: 201 })
  } catch (err: any) {
    // Handle unique email constraint
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }
    console.error('Failed to create user:', err)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
