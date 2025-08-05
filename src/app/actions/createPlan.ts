'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPlan(formData: FormData) {
  const payload = formData.get('payload') as string
  if (!payload) {
    throw new Error('Missing payload')
  }
  const data = JSON.parse(payload) as {
    userId: number
    name: string
    days: { name: string; exercises: { name: string; sets: { reps: number; weight: number }[] }[] }[]
  }

  await prisma.workoutPlan.create({
    data: {
      userId: data.userId,
      days: {
        create: data.days.map((d, idx) => ({
          name: d.name,
          order: idx + 1,
          exercises: {
            create: d.exercises.map((ex) => ({ name: ex.name, sets: ex.sets })),
          },
        })),
      },
    },
  })

  revalidatePath('/plans')
}
