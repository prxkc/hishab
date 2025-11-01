import Dexie, { type Table } from 'dexie'

import type {
  Account,
  Budget,
  Category,
  SavingsGoal,
  Snapshot,
  Transaction,
} from '@/domain/types'

export class HishabDatabase extends Dexie {
  accounts!: Table<Account, string>
  categories!: Table<Category, string>
  budgets!: Table<Budget, string>
  transactions!: Table<Transaction, string>
  goals!: Table<SavingsGoal, string>
  snapshots!: Table<Snapshot, string>

  constructor() {
    super('hishab-local')

    this.version(1).stores({
      accounts: 'id, name, type, archived',
      categories: 'id, name, type, parentId, archived',
      budgets: 'id, month, categoryId',
      transactions: 'id, date, type, accountId, categoryId, [date+categoryId], [date+accountId]',
      goals: 'id, targetDate',
      snapshots: 'id, month',
    })
  }
}

export const db = new HishabDatabase()

export async function ensureDatabaseOpen() {
  if (!db.isOpen()) {
    await db.open()
  }
  return db
}
