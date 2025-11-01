import type { SeedPayload } from './types'

export const DEFAULT_CURRENCY = 'BDT'
export const DEFAULT_LOCALE = 'en-BD'
export const DEFAULT_TIMEZONE = 'Asia/Dhaka'

export const SEED_DATA: SeedPayload = {
  accounts: [
    {
      id: 'acct-bank-001',
      name: 'City Bank',
      type: 'bank',
      balance: 120000,
      currency: DEFAULT_CURRENCY,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'acct-bkash-001',
      name: 'bKash Wallet',
      type: 'wallet',
      balance: 15000,
      currency: DEFAULT_CURRENCY,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'acct-cash-001',
      name: 'Cash',
      type: 'cash',
      balance: 8000,
      currency: DEFAULT_CURRENCY,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  categories: [
    { id: 'cat-exp-food', name: 'Food & Groceries', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-exp-transport', name: 'Transport', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-exp-bills', name: 'Bills & Utilities', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-exp-rent', name: 'Rent', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-exp-education', name: 'Education', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-exp-health', name: 'Health', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-exp-entertainment', name: 'Entertainment', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-exp-shopping', name: 'Shopping', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-exp-gifts', name: 'Gifts & Donations', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-exp-fees', name: 'Fees & Charges', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-inc-salary', name: 'Salary', type: 'income', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-inc-bonus', name: 'Bonus', type: 'income', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-inc-interest', name: 'Interest', type: 'income', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-inc-gifts', name: 'Gift Received', type: 'income', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat-inc-other', name: 'Other', type: 'income', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  budgets: [],
  transactions: [],
  goals: [],
}
