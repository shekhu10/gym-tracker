-- Add target tracking columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "targetValue" NUMERIC;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "targetUnit" TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "currentProgress" NUMERIC DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "targetAchieved" BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "targetAchievedAt" TIMESTAMP(3);

-- Create task_targets_history table
CREATE TABLE IF NOT EXISTS "task_targets_history" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "targetValue" NUMERIC NOT NULL,
    "targetUnit" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "achievedAt" TIMESTAMP(3),
    "finalProgress" NUMERIC,

    CONSTRAINT "task_targets_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "task_targets_history" ADD CONSTRAINT "task_targets_history_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "task_targets_history_taskId_idx" ON "task_targets_history"("taskId");

