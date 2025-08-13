import { userDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/users/:userId - fetch single user
export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const { userId } = await params;
  const user = await userDb.findUnique(Number(userId));
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

// PUT /api/users/:userId - update name/email
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const { userId } = await params;
  const body = await req.json();
  const { name, email } = body as { name?: string; email?: string };
  if (!name && !email) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  try {
    const user = await userDb.update(Number(userId), { name, email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err: any) {
    if (err.message?.includes("duplicate key") || err.code === "23505") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 },
      );
    }
    console.error("Failed to update user:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE /api/users/:userId - remove user and cascade logs
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const { userId } = await params;
  try {
    const deletedUser = await userDb.delete(Number(userId));
    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete user:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
