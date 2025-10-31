import { NextResponse } from "next/server";
import { habitCategoriesDb } from "@/lib/db";

interface Context {
  params: { userId: string; categoryId: string };
}

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: Context) {
  const { categoryId } = await params;
  const body = await req.json();

  // Verify category exists
  const category = await habitCategoriesDb.findUnique(Number(categoryId));
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  try {
    const updated = await habitCategoriesDb.update(Number(categoryId), {
      name: body.name ? body.name.trim() : undefined,
      color: body.color !== undefined ? body.color : undefined,
    });

    if (!updated)
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 },
      );

    return NextResponse.json(updated);
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

export async function DELETE(_: Request, { params }: Context) {
  const { categoryId } = await params;
  const deleted = await habitCategoriesDb.delete(Number(categoryId));
  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deleted);
}

