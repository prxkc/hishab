import dayjs from 'dayjs'

import { DEFAULT_CURRENCY, SEED_DATA } from '@/domain/constants'
import type { Budget } from '@/domain/types'
import { ensureDatabaseOpen } from './db'

export async function seedDatabaseIfNeeded() {
  const db = await ensureDatabaseOpen()
  const existingAccounts = await db.accounts.count()

  if (existingAccounts > 0) {
    return false
  }

  const now = dayjs().toISOString()

  await db.transaction('rw', db.accounts, db.categories, db.budgets, async () => {
    await db.accounts.bulkPut(
      SEED_DATA.accounts.map((account) => ({
        ...account,
        currency: account.currency ?? DEFAULT_CURRENCY,
        createdAt: account.createdAt ?? now,
        updatedAt: account.updatedAt ?? now,
      })),
    )

    await db.categories.bulkPut(
      SEED_DATA.categories.map((category) => ({
        ...category,
        parentId: category.parentId ?? null,
        createdAt: category.createdAt ?? now,
        updatedAt: category.updatedAt ?? now,
      })),
    )

    if (SEED_DATA.budgets.length > 0) {
      await db.budgets.bulkPut(SEED_DATA.budgets)
    } else {
      const currentMonth = dayjs().format('YYYY-MM')
      const expenseCategories = SEED_DATA.categories.filter((category) => category.type === 'expense')
      const starterBudgets: Budget[] = expenseCategories.map((category) => ({
        id: `bdg-${category.id}`,
        month: currentMonth,
        categoryId: category.id,
        amount: 0,
        spent: 0,
        createdAt: now,
        updatedAt: now,
      }))
      await db.budgets.bulkPut(starterBudgets)
    }
  })

  return true
}
