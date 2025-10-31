import { NextResponse } from "next/server";
import { habitCategoriesDb } from "@/lib/db";

interface Context {
  params: { userId: string };
}

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: Context) {
  const userId = Number((await params).userId);
  const categories = await habitCategoriesDb.findMany(userId);
  return NextResponse.json(categories);
}

export async function POST(req: Request, { params }: Context) {
  const userId = Number((await params).userId);
  const body = await req.json();
  
  const errors: string[] = [];
  if (!body?.name) errors.push("name is required");
  
  if (errors.length)
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });

  try {
    const created = await habitCategoriesDb.create(userId, {
      name: body.name.trim(),
      color: body.color ?? null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    // Check for unique constraint violation
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 },
      );
    }
    throw error;
  }
}

