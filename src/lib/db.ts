import postgres from "postgres";

// Database connection using postgres package
const sql = postgres(process.env.DATABASE_URL!, {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  connect_timeout: 10, // Connection timeout in seconds
});

// Normalize a JS Date (or date-like) to a YYYY-MM-DD string with no time
function toIsoDateString(dateValue: unknown): string | null {
  if (!dateValue) return null;
  // If it's already a YYYY-MM-DD string (from DATE column), return as-is
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue as any);
  if (isNaN(d.getTime())) return null;
  // Use calendar date in server's local timezone to avoid timezone shifts
  // and output as ISO date (YYYY-MM-DD)
  return d.toLocaleDateString("en-CA");
}

// User-related database operations
export const userDb = {
  // Get all users
  async findMany() {
    return await sql`
      SELECT id, name, email, "createdAt"
      FROM "User"
      ORDER BY id
    `;
  },

  // Get user by ID
  async findUnique(id: number) {
    const result = await sql`
      SELECT id, name, email, 
             "monPlan", "tuePlan", "wedPlan",
             "thuPlan", "friPlan", "satPlan", 
             "sunPlan", "createdAt"
      FROM "User"
      WHERE id = ${id}
    `;
    return result[0] || null;
  },

  // Get specific day plan for user
  async findDayPlan(userId: number, dayColumn: string) {
    const result = await sql`
      SELECT id, ${sql(dayColumn)} as plan
      FROM "User"
      WHERE id = ${userId}
    `;
    const user = result[0] || null;
    if (user && user.plan) {
      // Parse JSON plan if it's a string
      user.plan =
        typeof user.plan === "string" ? JSON.parse(user.plan) : user.plan;
    }
    return user;
  },

  // Update day plan for user
  async updateDayPlan(userId: number, dayColumn: string, planData: any) {
    const result = await sql`
      UPDATE "User"
      SET ${sql(dayColumn)} = ${JSON.stringify(planData)}
      WHERE id = ${userId}
      RETURNING id, ${sql(dayColumn)} as plan
    `;
    return result[0] || null;
  },

  // Clear day plan for user
  async clearDayPlan(userId: number, dayColumn: string) {
    const result = await sql`
      UPDATE "User"
      SET ${sql(dayColumn)} = NULL
      WHERE id = ${userId}
      RETURNING id
    `;
    return result[0] || null;
  },

  // Create new user
  async create(name: string, email: string) {
    const result = await sql`
      INSERT INTO "User" (name, email)
      VALUES (${name}, ${email})
      RETURNING id, name, email, "createdAt"
    `;
    return result[0];
  },

  // Update user
  async update(id: number, data: { name?: string; email?: string }) {
    if (data.name !== undefined && data.email !== undefined) {
      // Update both name and email
      const result = await sql`
        UPDATE "User"
        SET name = ${data.name}, email = ${data.email}
        WHERE id = ${id}
        RETURNING id, name, email, "createdAt"
      `;
      return result[0] || null;
    } else if (data.name !== undefined) {
      // Update only name
      const result = await sql`
        UPDATE "User"
        SET name = ${data.name}
        WHERE id = ${id}
        RETURNING id, name, email, "createdAt"
      `;
      return result[0] || null;
    } else if (data.email !== undefined) {
      // Update only email
      const result = await sql`
        UPDATE "User"
        SET email = ${data.email}
        WHERE id = ${id}
        RETURNING id, name, email, "createdAt"
      `;
      return result[0] || null;
    }

    return null;
  },

  // Delete user
  async delete(id: number) {
    const result = await sql`
      DELETE FROM "User"
      WHERE id = ${id}
      RETURNING id
    `;
    return result[0] || null;
  },
};

// WorkoutLog-related database operations
export const workoutLogDb = {
  // Get workout logs for user
  async findMany(userId: number, dayName?: string) {
    let results;
    if (dayName) {
      results = await sql`
        SELECT id, "userId", date, "dayName", 
               "planName", entries, "createdAt"
        FROM "WorkoutLog"
        WHERE "userId" = ${userId} AND "dayName" = ${dayName}
        ORDER BY date DESC
      `;
    } else {
      results = await sql`
        SELECT id, "userId", date, "dayName", 
               "planName", entries, "createdAt"
        FROM "WorkoutLog"
        WHERE "userId" = ${userId}
        ORDER BY date DESC
      `;
    }

    // Parse JSON entries and normalize date to YYYY-MM-DD
    return results.map((log) => ({
      ...log,
      date: toIsoDateString(log.date),
      entries:
        typeof log.entries === "string" ? JSON.parse(log.entries) : log.entries,
    }));
  },

  // Get single workout log
  async findUnique(id: number) {
    const result = await sql`
      SELECT id, "userId", date, "dayName", 
             "planName", entries, "createdAt"
      FROM "WorkoutLog"
      WHERE id = ${id}
    `;
    const log = result[0] || null;
    if (log) {
      // Parse JSON entries and normalize date
      log.entries =
        typeof log.entries === "string" ? JSON.parse(log.entries) : log.entries;
      log.date = toIsoDateString(log.date);
    }
    return log;
  },

  // Create new workout log
  async create(
    userId: number,
    dayName: string,
    planName: string,
    entries: any,
    logDate?: string | Date,
  ) {
    const dateParam =
      typeof logDate === "string"
        ? logDate
        : toIsoDateString(logDate) || new Date().toLocaleDateString("en-CA");

    const result = await sql`
      INSERT INTO "WorkoutLog" ("userId", "dayName", "planName", entries, date)
      VALUES (${userId}, ${dayName}, ${planName}, ${JSON.stringify(entries)}, ${dateParam})
      RETURNING id, "userId", date, "dayName", 
                "planName", entries, "createdAt"
    `;
    const log = result[0];
    if (log) {
      // Parse JSON entries and normalize date
      log.entries =
        typeof log.entries === "string" ? JSON.parse(log.entries) : log.entries;
      log.date = toIsoDateString(log.date);
    }
    return log;
  },

  // Update workout log
  async update(
    id: number,
    data: { dayName?: string; planName?: string; entries?: any },
  ) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.dayName !== undefined) {
      updates.push('"dayName"');
      values.push(data.dayName);
    }
    if (data.planName !== undefined) {
      updates.push('"planName"');
      values.push(data.planName);
    }
    if (data.entries !== undefined) {
      updates.push("entries");
      values.push(JSON.stringify(data.entries));
    }

    if (updates.length === 0) return null;

    const setClause = updates.map((col, i) => `${col} = $${i + 2}`).join(", ");

    const result = await sql`
      UPDATE "WorkoutLog"
      SET ${sql.unsafe(setClause)}
      WHERE id = ${id}
      RETURNING id, "userId", date, "dayName", 
                "planName", entries, "createdAt"
    `;
    const log = result[0] || null;
    if (log) {
      // Parse JSON entries and normalize date
      log.entries =
        typeof log.entries === "string" ? JSON.parse(log.entries) : log.entries;
      log.date = toIsoDateString(log.date);
    }
    return log;
  },

  // Delete workout log
  async delete(id: number) {
    const result = await sql`
      DELETE FROM "WorkoutLog"
      WHERE id = ${id}
      RETURNING id
    `;
    return result[0] || null;
  },

  // Find workout log from previous week (7 days back) for the same day
  async findPreviousWeekLog(
    userId: number,
    dayName: string,
    currentDate: string,
  ) {
    // Calculate date 7 days back in local timezone
    const [year, month, day] = currentDate.split('-').map(Number);
    const currentDateObj = new Date(year, month - 1, day); // month is 0-indexed
    const previousWeekDate = new Date(currentDateObj);
    previousWeekDate.setDate(currentDateObj.getDate() - 7);
    const previousWeekDateStr = previousWeekDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD

    const result = await sql`
      SELECT id, "userId", date, "dayName", 
             "planName", entries, "createdAt"
      FROM "WorkoutLog"
      WHERE "userId" = ${userId} 
        AND "dayName" = ${dayName}
        AND date = ${previousWeekDateStr}
      ORDER BY "createdAt" ASC
      LIMIT 1
    `;
    const log = result[0] || null;
    if (log) {
      // Parse JSON entries and normalize date
      log.entries =
        typeof log.entries === "string" ? JSON.parse(log.entries) : log.entries;
      log.date = toIsoDateString(log.date);
    }
    return log;
  },
};

export default sql;
