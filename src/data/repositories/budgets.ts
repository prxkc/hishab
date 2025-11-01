import dayjs from 'dayjs'

import type { Budget } from '@/domain/types'
import { createId } from '@/lib/id'
import { ensureDatabaseOpen } from '../db'

export async function getBudgetsByMonth(month: string) {
  const db = await ensureDatabaseOpen()
  return db.budgets.where('month').equals(month).toArray()
}

export async function upsertBudget(month: string, categoryId: string, amount: number) {
  const db = await ensureDatabaseOpen()
  const existing = await db.budgets.where({ month, categoryId }).first()
  const timestamp = dayjs().toISOString()
  if (existing) {
    const updated: Budget = {
      ...existing,
      amount,
      updatedAt: timestamp,
    }
    await db.budgets.put(updated)
    return updated
  }
  const budget: Budget = {
    id: createId('bdg'),
    month,
    categoryId,
    amount,
    spent: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.budgets.put(budget)
  return budget
}

export async function deleteBudget(id: string) {
  const db = await ensureDatabaseOpen()
  await db.budgets.delete(id)
}
