import dayjs from 'dayjs'

import type { SavingsGoal } from '@/domain/types'
import { createId } from '@/lib/id'
import { ensureDatabaseOpen } from '../db'

export async function getGoals() {
  const db = await ensureDatabaseOpen()
  return db.goals.orderBy('targetDate').toArray()
}

interface CreateGoalInput {
  name: string
  targetAmount: number
  targetDate?: string | null
  currentAllocated?: number
}

export async function createGoal(input: CreateGoalInput) {
  const db = await ensureDatabaseOpen()
  const timestamp = dayjs().toISOString()
  const goal: SavingsGoal = {
    id: createId('goal'),
    name: input.name,
    targetAmount: input.targetAmount,
    targetDate: input.targetDate ?? null,
    currentAllocated: input.currentAllocated ?? 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.goals.put(goal)
  return goal
}

interface UpdateGoalInput {
  id: string
  name?: string
  targetAmount?: number
  targetDate?: string | null
  currentAllocated?: number
}

export async function updateGoal(input: UpdateGoalInput) {
  const db = await ensureDatabaseOpen()
  const existing = await db.goals.get(input.id)
  if (!existing) {
    throw new Error('Goal not found')
  }
  const updated: SavingsGoal = {
    ...existing,
    ...('name' in input && input.name !== undefined ? { name: input.name } : {}),
    ...('targetAmount' in input && input.targetAmount !== undefined
      ? { targetAmount: input.targetAmount }
      : {}),
    ...('targetDate' in input ? { targetDate: input.targetDate ?? null } : {}),
    ...('currentAllocated' in input && input.currentAllocated !== undefined
      ? { currentAllocated: input.currentAllocated }
      : {}),
    updatedAt: dayjs().toISOString(),
  }
  await db.goals.put(updated)
  return updated
}

export async function deleteGoal(id: string) {
  const db = await ensureDatabaseOpen()
  await db.goals.delete(id)
}
