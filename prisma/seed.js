// Seed script for Gym Tracker
// Run with: npx prisma db seed

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const samplePlan = {
  workoutDay: 'Legs',
  exercises: [
    {
      name: 'exerciseName1',
      sets: [
        { reps: 10, weight: 10 },
        { reps: 5, weight: 5 },
      ],
    },
    {
      name: 'exerciseName2',
      sets: [
        { reps: 10, weight: 10 },
        { reps: 5, weight: 5 },
      ],
    },
  ],
};

async function main() {
  // Create demo user with a sample workout plan
  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      monPlan: samplePlan,
      tuePlan: samplePlan,
      wedPlan: samplePlan,
      thuPlan: samplePlan,
      friPlan: samplePlan,
      satPlan: samplePlan,
      sunPlan: samplePlan,
    },
    create: {
      name: 'Demo User',
      email: 'demo@example.com',
      // Sample weekly plans
      monPlan: samplePlan,
      tuePlan: samplePlan,
      wedPlan: samplePlan,
      thuPlan: samplePlan,
      friPlan: samplePlan,
      satPlan: samplePlan,
      sunPlan: samplePlan,
    },
  });

  console.log('🌱 Seed data inserted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
