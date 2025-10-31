-- Create habit_categories table
CREATE TABLE IF NOT EXISTS "habit_categories" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_categories_pkey" PRIMARY KEY ("id")
);

-- Foreign key to User
ALTER TABLE "habit_categories" ADD CONSTRAINT "habit_categories_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Index for performance
CREATE INDEX "habit_categories_userId_idx" ON "habit_categories"("userId");

-- Unique constraint: one user cannot have duplicate category names
CREATE UNIQUE INDEX "habit_categories_userId_name_key" ON "habit_categories"("userId", "name");

-- Add categoryId to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "categoryId" INTEGER;

-- Foreign key to habit_categories (nullable, habits can exist without a category)
ALTER TABLE tasks ADD CONSTRAINT "tasks_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "habit_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for performance
CREATE INDEX "tasks_categoryId_idx" ON tasks("categoryId");

