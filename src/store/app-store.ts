import dayjs from 'dayjs'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

import type {
  Account,
  Budget,
  Category,
  SavingsGoal,
  Snapshot,
  Transaction,
  TransactionKind,
} from '@/domain/types'
import { seedDatabaseIfNeeded } from '@/data/seed'
import {
  accountRepository,
  budgetRepository,
  categoryRepository,
  goalRepository,
  snapshotRepository,
  transactionRepository,
} from '@/data/repositories'

export interface AppState {
  isLoading: boolean
  isSeeded: boolean
  loadError: string | null
  selectedMonth: string
  accounts: Account[]
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
  goals: SavingsGoal[]
  snapshots: Snapshot[]
  initialize: () => Promise<void>
  refresh: () => Promise<void>
  setSelectedMonth: (month: string) => void
  addTransaction: (input: {
    date: string
    type: TransactionKind
    amount: number
    accountId: string
    counterpartyAccountId?: string | null
    categoryId?: string | null
    notes?: string
    tags?: string[]
  }) => Promise<Transaction>
  addAccount: (input: {
    name: string
    type: Account['type']
    balance: number
    currency: string
  }) => Promise<Account>
  addCategory: (input: {
    name: string
    type: Category['type']
    parentId?: string | null
  }) => Promise<Category>
  upsertBudgets: (updates: Array<{ categoryId: string; amount: number }>) => Promise<void>
  copyBudgetsFromPreviousMonth: () => Promise<void>
  addGoal: (input: {
    name: string
    targetAmount: number
    targetDate?: string | null
  }) => Promise<SavingsGoal>
  updateGoal: (input: { id: string; currentAllocated: number }) => Promise<SavingsGoal>
  deleteTransaction: (id: string) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
}

async function hydrateState(set: (partial: Partial<AppState>) => void, selectedMonth: string) {
  try {
    set({ isLoading: true, loadError: null })

    const [accounts, categories, budgets, transactions, goals, snapshots] = await Promise.all([
      accountRepository.getAccounts(),
      categoryRepository.getCategories(),
      budgetRepository.getBudgetsByMonth(selectedMonth),
      transactionRepository.getTransactions({ month: selectedMonth }),
      goalRepository.getGoals(),
      snapshotRepository.getSnapshots(),
    ])

    set({
      accounts,
      categories,
      budgets,
      transactions,
      goals,
      snapshots,
      isLoading: false,
      loadError: null,
    })
  } catch (error) {
    console.error('Failed to hydrate state', error)
    const message = error instanceof Error ? error.message : 'Unknown error while loading data.'
    set({ isLoading: false, loadError: message })
    throw error
  }
}

export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      isLoading: true,
      isSeeded: false,
      loadError: null,
      selectedMonth: dayjs().format('YYYY-MM'),
      accounts: [],
      categories: [],
      budgets: [],
      transactions: [],
      goals: [],
      snapshots: [],
      initialize: async () => {
        try {
          const seeded = await seedDatabaseIfNeeded()
          set({ isSeeded: seeded, loadError: null })
          await hydrateState(set, get().selectedMonth)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Initialization failed.'
          set({ isLoading: false, loadError: message })
        }
      },
      refresh: async () => {
        try {
          await hydrateState(set, get().selectedMonth)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Refresh failed.'
          set({ loadError: message })
        }
      },
      setSelectedMonth: (month) => {
        set({ selectedMonth: month })
        void hydrateState(set, month).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Failed to load month.'
          set({ loadError: message })
        })
      },
      addTransaction: async (input) => {
        const transaction = await transactionRepository.createTransaction(input)
        await hydrateState(set, get().selectedMonth).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Refresh failed.'
          set({ loadError: message })
        })
        return transaction
      },
      addAccount: async (input) => {
        const account = await accountRepository.createAccount(input)
        await hydrateState(set, get().selectedMonth).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Refresh failed.'
          set({ loadError: message })
        })
        return account
      },
      addCategory: async (input) => {
        const category = await categoryRepository.createCategory(input)
        await hydrateState(set, get().selectedMonth).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Refresh failed.'
          set({ loadError: message })
        })
        return category
      },
      upsertBudgets: async (updates) => {
        const month = get().selectedMonth
        await Promise.all(
          updates.map((update) =>
            budgetRepository.upsertBudget(month, update.categoryId, update.amount),
          ),
        )
        await hydrateState(set, month).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Refresh failed.'
          set({ loadError: message })
        })
      },
      copyBudgetsFromPreviousMonth: async () => {
        const month = get().selectedMonth
        const previousMonth = dayjs(month, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM')
        const previousBudgets = await budgetRepository.getBudgetsByMonth(previousMonth)
        await Promise.all(
          previousBudgets.map((budget) =>
            budgetRepository.upsertBudget(month, budget.categoryId, budget.amount),
          ),
        )
        await hydrateState(set, month).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Refresh failed.'
          set({ loadError: message })
        })
      },
      addGoal: async (input) => {
        const goal = await goalRepository.createGoal({
          ...input,
          currentAllocated: 0,
        })
        await hydrateState(set, get().selectedMonth).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Refresh failed.'
          set({ loadError: message })
        })
        return goal
      },
      updateGoal: async (input) => {
        const goal = await goalRepository.updateGoal({
          id: input.id,
          currentAllocated: input.currentAllocated,
        })
        await hydrateState(set, get().selectedMonth).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Refresh failed.'
          set({ loadError: message })
        })
        return goal
      },
      deleteTransaction: async (id) => {
        try {
          await transactionRepository.deleteTransaction(id)
          await hydrateState(set, get().selectedMonth)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to delete transaction.'
          set({ loadError: message })
          throw error
        }
      },
      deleteAccount: async (id) => {
        try {
          await accountRepository.deleteAccount(id)
          await hydrateState(set, get().selectedMonth)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to delete account.'
          set({ loadError: message })
          throw error
        }
      },
      deleteGoal: async (id) => {
        try {
          await goalRepository.deleteGoal(id)
          await hydrateState(set, get().selectedMonth)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to delete goal.'
          set({ loadError: message })
          throw error
        }
      },
      deleteBudget: async (id) => {
        try {
          await budgetRepository.deleteBudget(id)
          await hydrateState(set, get().selectedMonth)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to delete budget.'
          set({ loadError: message })
          throw error
        }
      },
    })),
    { name: 'hishab-app-store' },
  ),
)
