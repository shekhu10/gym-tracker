import { userDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/users  -> list all users
export async function GET() {
  try {
    const users = await userDb.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST /api/users  -> create a new user
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email } = body as { name?: string; email?: string };

  if (!name || !email) {
    return NextResponse.json(
      { error: "name and email are required" },
      { status: 400 },
    );
  }

  try {
    const user = await userDb.create(name, email);
    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    // Handle unique email constraint
    if (err.message?.includes("duplicate key") || err.code === "23505") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 },
      );
    }
    console.error("Failed to create user:", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
