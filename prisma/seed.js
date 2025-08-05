// Seed script for Gym Tracker
// Run with: npx prisma db seed

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const samplePlan = {
  workoutDay: 'Legs',
  exercises: [
    {
      type: 'single',
      name: 'Leg Press',
      restBetweenSets: 60,
      sets: [
        {
          reps: 10,
          weight: 100,
          type: 'warmup',
        },
        {
          reps: 8,
          weight: 120,
          type: 'normal',
        },
        {
          type: 'strip',
          stripSets: [
            { reps: 8, weight: 100 },
            { reps: 6, weight: 80 },
            { reps: 4, weight: 60 },
          ],
        },
      ],
      restAfterExercise: 90,
    },
    {
      type: 'circuit',
      name: 'Leg Circuit A',
      restBetweenExercises: 30,
      restBetweenRounds: 120,
      rounds: 3,
      exercises: [
        {
          name: 'Jump Squats',
          sets: [{ reps: 15, weight: 0 }],
        },
        {
          name: 'Walking Lunges',
          sets: [{ reps: 20, weight: 10, type: 'normal' }],
        },
        {
          name: 'Box Jumps',
          sets: [{ reps: 12, weight: 0 }],
        },
      ],
      restAfterExercise: 90,
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
