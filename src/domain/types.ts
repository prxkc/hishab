export type AccountKind = 'cash' | 'bank' | 'wallet'
export type CategoryKind = 'expense' | 'income'
export type TransactionKind = 'income' | 'expense' | 'transfer'

export interface Account {
  id: string
  name: string
  type: AccountKind
  balance: number
  currency: string
  archived?: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  type: CategoryKind
  parentId?: string | null
  archived?: boolean
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  month: string // YYYY-MM
  categoryId: string
  amount: number
  spent: number
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  date: string // ISO string
  type: TransactionKind
  amount: number
  accountId: string
  counterpartyAccountId?: string | null
  categoryId?: string | null
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  targetDate?: string | null
  currentAllocated: number
  createdAt: string
  updatedAt: string
}

export interface SnapshotCategoryTotal {
  categoryId: string
  amount: number
}

export interface Snapshot {
  id: string
  month: string
  netWorth: number
  totals: {
    income: number
    expense: number
  }
  byCategory: SnapshotCategoryTotal[]
  createdAt: string
}

export interface SeedPayload {
  accounts: Account[]
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
  goals: SavingsGoal[]
}

export interface BackupPayload {
  version: number
  exportedAt: string
  data: {
    accounts: Account[]
    categories: Category[]
    budgets: Budget[]
    transactions: Transaction[]
    goals: SavingsGoal[]
    snapshots: Snapshot[]
  }
}
