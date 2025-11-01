import dayjs from 'dayjs'

import type { BackupPayload } from '@/domain/types'
import { ensureDatabaseOpen } from '../db'

const BACKUP_VERSION = 1

export async function exportToJson(): Promise<BackupPayload> {
  const db = await ensureDatabaseOpen()
  const [accounts, categories, budgets, transactions, goals, snapshots] = await Promise.all([
    db.accounts.toArray(),
    db.categories.toArray(),
    db.budgets.toArray(),
    db.transactions.toArray(),
    db.goals.toArray(),
    db.snapshots.toArray(),
  ])

  return {
    version: BACKUP_VERSION,
    exportedAt: dayjs().toISOString(),
    data: {
      accounts,
      categories,
      budgets,
      transactions,
      goals,
      snapshots,
    },
  }
}

export async function importFromJson(payload: BackupPayload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid backup payload')
  }

  const db = await ensureDatabaseOpen()

  await db.transaction(
    'rw',
    [db.accounts, db.categories, db.budgets, db.transactions, db.goals, db.snapshots],
    async () => {
      await Promise.all([
        db.accounts.clear(),
        db.categories.clear(),
        db.budgets.clear(),
        db.transactions.clear(),
        db.goals.clear(),
        db.snapshots.clear(),
      ])

      await db.accounts.bulkPut(payload.data.accounts)
      await db.categories.bulkPut(payload.data.categories)
      await db.budgets.bulkPut(payload.data.budgets)
      await db.transactions.bulkPut(payload.data.transactions)
      await db.goals.bulkPut(payload.data.goals)
      await db.snapshots.bulkPut(payload.data.snapshots)
    },
  )
}

export async function clearAllData() {
  const db = await ensureDatabaseOpen()
  await db.delete()
}
