import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import type { AppState } from './app-store'
import { formatCurrency } from '@/lib/utils'

dayjs.extend(isBetween)

export const selectAccounts = (state: AppState) => state.accounts
export const selectCategories = (state: AppState) => state.categories
export const selectBudgets = (state: AppState) => state.budgets
export const selectTransactions = (state: AppState) => state.transactions
export const selectGoals = (state: AppState) => state.goals
export const selectSelectedMonth = (state: AppState) => state.selectedMonth

export const selectNetWorth = (state: AppState) =>
  state.accounts.reduce<number>((total, account) => total + account.balance, 0)

export const selectMonthlyCashFlow = (state: AppState) => {
  let income = 0
  let expense = 0

  const [year, month] = state.selectedMonth.split('-').map(Number)
  const range = {
    start: dayjs().year(year).month((month ?? 1) - 1).startOf('month'),
    end: dayjs().year(year).month((month ?? 1) - 1).endOf('month'),
  }

  state.transactions.forEach((transaction) => {
    const date = dayjs(transaction.date)
    if (!date.isBetween(range.start, range.end, null, '[]')) {
      return
    }
    if (transaction.type === 'income') {
      income += transaction.amount
    }
    if (transaction.type === 'expense') {
      expense += transaction.amount
    }
  })

  return { income, expense, net: income - expense }
}

export const selectBudgetUsage = (state: AppState) => {
  return state.budgets.map((budget) => {
    const spent = state.transactions
      .filter((txn) => txn.categoryId === budget.categoryId && txn.type === 'expense')
      .reduce<number>((total, txn) => total + txn.amount, 0)
    return {
      ...budget,
      spent,
      remaining: budget.amount - spent,
      progress: budget.amount > 0 ? Math.min(spent / budget.amount, 1) : 0,
    }
  })
}

export const selectFormattedNetWorth = (state: AppState) =>
  formatCurrency(selectNetWorth(state), 'en-BD', 'BDT')
