import dayjs from 'dayjs'

import type { Transaction, TransactionKind } from '@/domain/types'
import { createId } from '@/lib/id'
import { ensureDatabaseOpen } from '../db'

export interface TransactionFilters {
  month?: string // YYYY-MM
  categoryId?: string
  accountId?: string
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const db = await ensureDatabaseOpen()

  if (filters.month) {
    const [year, month] = filters.month.split('-').map(Number)
    const start = dayjs()
      .year(year)
      .month((month ?? 1) - 1)
      .startOf('month')
    const end = start.endOf('month')
    const transactions = await db.transactions
      .where('date')
      .between(start.toISOString(), end.toISOString(), true, true)
      .filter((txn) =>
        [
          !filters.categoryId || txn.categoryId === filters.categoryId,
          !filters.accountId || txn.accountId === filters.accountId,
        ].every(Boolean),
      )
      .toArray()
    return sortTransactions(transactions)
  }

  const transactions = await db.transactions.orderBy('date').toArray()
  return sortTransactions(transactions)
}

interface CreateTransactionInput {
  date: string
  type: TransactionKind
  amount: number
  accountId: string
  counterpartyAccountId?: string | null
  categoryId?: string | null
  notes?: string
  tags?: string[]
}

export async function createTransaction(input: CreateTransactionInput) {
  const db = await ensureDatabaseOpen()
  const timestamp = dayjs().toISOString()

  return db.transaction('rw', [db.transactions, db.accounts], async () => {
    const primaryAccount = await db.accounts.get(input.accountId)
    if (!primaryAccount) {
      throw new Error('Primary account not found for transaction')
    }

    const counterpartyAccount =
      input.counterpartyAccountId !== undefined && input.counterpartyAccountId !== null
        ? await db.accounts.get(input.counterpartyAccountId)
        : null

    const trimmedNotes = input.notes?.trim() ?? ''
    let resolvedNotes: string | undefined = trimmedNotes || undefined

    if (input.type === 'transfer' && !resolvedNotes && (primaryAccount || counterpartyAccount)) {
      resolvedNotes = `Transfer from ${primaryAccount.name}${
        counterpartyAccount ? ` to ${counterpartyAccount.name}` : ''
      }`
    }

    const transaction: Transaction = {
      id: createId('txn'),
      date: input.date,
      type: input.type,
      amount: input.amount,
      accountId: input.accountId,
      counterpartyAccountId: input.counterpartyAccountId ?? null,
      categoryId: input.categoryId ?? null,
      notes: resolvedNotes,
      tags: input.tags ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await db.transactions.put(transaction)

    const deltaForPrimary = calculateDelta(transaction.type, transaction.amount, 'primary')
    await db.accounts.update(primaryAccount.id, {
      balance: primaryAccount.balance + deltaForPrimary,
      updatedAt: timestamp,
    })

    if (transaction.type === 'transfer' && counterpartyAccount) {
      const deltaForCounter = calculateDelta(transaction.type, transaction.amount, 'counterparty')
      await db.accounts.update(counterpartyAccount.id, {
        balance: counterpartyAccount.balance + deltaForCounter,
        updatedAt: timestamp,
      })
    }

    return transaction
  })
}

interface UpdateTransactionInput {
  id: string
  amount?: number
  date?: string
  categoryId?: string | null
  notes?: string
  tags?: string[]
}

export async function updateTransaction(input: UpdateTransactionInput) {
  const db = await ensureDatabaseOpen()
  const existing = await db.transactions.get(input.id)
  if (!existing) {
    throw new Error('Transaction not found')
  }

  const updated: Transaction = {
    ...existing,
    ...('amount' in input && input.amount !== undefined ? { amount: input.amount } : {}),
    ...('date' in input && input.date !== undefined ? { date: input.date } : {}),
    ...('categoryId' in input ? { categoryId: input.categoryId ?? null } : {}),
    ...('notes' in input ? { notes: input.notes } : {}),
    ...('tags' in input && input.tags !== undefined ? { tags: input.tags } : {}),
    updatedAt: dayjs().toISOString(),
  }

  await db.transactions.put(updated)
  return updated
}

export async function deleteTransaction(id: string) {
  const db = await ensureDatabaseOpen()
  const existing = await db.transactions.get(id)
  if (!existing) {
    return
  }

  await db.transaction('rw', [db.transactions, db.accounts], async () => {
    await db.transactions.delete(id)

    const primary = await db.accounts.get(existing.accountId)
    const timestamp = dayjs().toISOString()

    if (primary) {
      const delta = -calculateDelta(existing.type, existing.amount, 'primary')
      await db.accounts.update(primary.id, {
        balance: primary.balance + delta,
        updatedAt: timestamp,
      })
    }

    if (existing.type === 'transfer' && existing.counterpartyAccountId) {
      const counter = await db.accounts.get(existing.counterpartyAccountId)
      if (counter) {
        const deltaCounter = -calculateDelta(existing.type, existing.amount, 'counterparty')
        await db.accounts.update(counter.id, {
          balance: counter.balance + deltaCounter,
          updatedAt: timestamp,
        })
      }
    }
  })
}

function calculateDelta(type: TransactionKind, amount: number, role: 'primary' | 'counterparty') {
  switch (type) {
    case 'income':
      return role === 'primary' ? amount : 0
    case 'expense':
      return role === 'primary' ? -amount : 0
    case 'transfer':
      return role === 'primary' ? -amount : amount
    default:
      return 0
  }
}

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((a, b) => {
    const dateDiff = dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    if (dateDiff !== 0) {
      return dateDiff
    }

    const createdDiff = dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
    if (createdDiff !== 0 && Number.isFinite(createdDiff)) {
      return createdDiff
    }

    return b.id.localeCompare(a.id)
  })
}
