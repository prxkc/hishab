import dayjs from 'dayjs'

import type { Account } from '@/domain/types'
import { createId } from '@/lib/id'
import { ensureDatabaseOpen } from '../db'

export async function getAccounts() {
  const db = await ensureDatabaseOpen()
  return db.accounts.toCollection().sortBy('createdAt')
}

export async function getAccountById(id: string) {
  const db = await ensureDatabaseOpen()
  return db.accounts.get(id)
}

export interface CreateAccountInput {
  name: string
  type: Account['type']
  balance: number
  currency: string
}

export async function createAccount(input: CreateAccountInput) {
  const db = await ensureDatabaseOpen()
  const timestamp = dayjs().toISOString()
  const account: Account = {
    id: createId('acct'),
    name: input.name,
    type: input.type,
    balance: input.balance,
    currency: input.currency,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.accounts.put(account)
  return account
}

export interface UpdateAccountInput {
  id: string
  name?: string
  balance?: number
  archived?: boolean
}

export async function updateAccount(input: UpdateAccountInput) {
  const db = await ensureDatabaseOpen()
  const existing = await db.accounts.get(input.id)
  if (!existing) {
    throw new Error('Account not found')
  }
  const updated: Account = {
    ...existing,
    ...('name' in input && input.name !== undefined ? { name: input.name } : {}),
    ...('balance' in input && input.balance !== undefined ? { balance: input.balance } : {}),
    ...('archived' in input && input.archived !== undefined ? { archived: input.archived } : {}),
    updatedAt: dayjs().toISOString(),
  }
  await db.accounts.put(updated)
  return updated
}

export async function deleteAccount(id: string) {
  const db = await ensureDatabaseOpen()
  const linkedTransactions = await db.transactions.where('accountId').equals(id).count()
  const linkedTransfers = await db.transactions
    .filter((txn) => txn.counterpartyAccountId === id)
    .count()

  if (linkedTransactions > 0 || linkedTransfers > 0) {
    throw new Error('Remove transactions involving this account before deleting it.')
  }

  await db.accounts.delete(id)
}
