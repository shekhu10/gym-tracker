# Add Habit Categories Feature

## Overview
Add support for user-defined categories to organize habits (e.g., study, food, exercise, hair growth). Users can create, edit, and delete their own categories, and assign habits to categories.

## Database Changes

### 1. Create `habit_categories` Table
**Migration:** Create new migration file

```sql
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
```

### 2. Add `categoryId` to `tasks` Table
**Migration:** Add to existing tasks table

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "categoryId" INTEGER;

-- Foreign key to habit_categories (nullable, so habits can exist without a category)
ALTER TABLE tasks ADD CONSTRAINT "tasks_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "habit_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for performance
CREATE INDEX "tasks_categoryId_idx" ON tasks("categoryId");
```

## Backend Implementation

### 3. Database Operations (`src/lib/db.ts`)

Add `habitCategoriesDb` object with:
- `findMany(userId)` - Get all categories for a user
- `findUnique(id)` - Get one category by id
- `create(userId, data)` - Create new category
- `update(id, data)` - Update category name/color
- `delete(id)` - Delete category (sets categoryId to NULL on related habits)

Update `tasksDb`:
- Add `categoryId` to all SELECT queries
- Add `categoryId` to create() and update() methods

### 4. Categories API Routes

**File:** `src/app/api/users/[userId]/categories/route.ts`
- `GET` - List all categories for user
- `POST` - Create new category (validate name uniqueness per user)

**File:** `src/app/api/users/[userId]/categories/[categoryId]/route.ts`
- `PUT` - Update category
- `DELETE` - Delete category

### 5. Update Habits API

**File:** `src/app/api/users/[userId]/habits/route.ts`
- Accept `categoryId` in POST request body (optional)

## Frontend Implementation

### 6. Category Management Page

**File:** `src/app/users/[userId]/categories/page.tsx`
- Display all user's categories
- Create new category form
- Edit/Delete category buttons

**File:** `src/app/users/[userId]/categories/CategoriesClient.tsx`
- Client component with state management
- Form for creating categories (name, optional color)
- List of existing categories with edit/delete actions
- Inline edit form similar to habits

### 7. Update CreateHabitForm

**File:** `src/app/users/[userId]/habits/create/CreateHabitForm.tsx`
- Fetch user's categories on component mount
- Add category dropdown field (optional, with "None" option)
- Send `categoryId` when creating habit

### 8. Update HabitsClient

**File:** `src/app/users/[userId]/habits/HabitsClient.tsx`
- Update `HabitTask` interface to include `categoryId` and `categoryName`
- Display category name for each habit (with optional color badge)
- Add category dropdown to edit form
- Optional: Group habits by category with collapsible sections

### 9. Update LogsClient (Optional Enhancement)

**File:** `src/app/users/[userId]/habits/logs/LogsClient.tsx`
- Update `Task` interface to include category info
- Display category in habit dropdown if needed

### 10. Navigation Update

**File:** `src/app/users/[userId]/habits/page.tsx`
- Add "Manage Categories" link/button to navigate to categories page

## User Experience Flow

1. **Create Categories:**
   - User navigates to "Manage Categories"
   - Creates categories like "Study", "Food", "Exercise"
   - Optionally assigns colors for visual differentiation

2. **Assign Category to Habit:**
   - When creating/editing a habit, user selects a category from dropdown
   - Category appears as a badge/label on the habit card

3. **View Organized Habits:**
   - Habits display with their category
   - Optional: Habits grouped by category with expand/collapse

4. **Delete Category:**
   - When deleting a category, habits in that category become uncategorized
   - User is warned before deletion if category has habits

## Optional Enhancements

- Color-coded category badges
- Category icons
- Filter/search habits by category
- Category statistics (habit count, completion rate)
- Default categories for new users

