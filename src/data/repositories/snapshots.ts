import dayjs from 'dayjs'

import type { Snapshot } from '@/domain/types'
import { createId } from '@/lib/id'
import { ensureDatabaseOpen } from '../db'

export async function getSnapshots(limit = 24) {
  const db = await ensureDatabaseOpen()
  return db.snapshots.orderBy('month').reverse().limit(limit).toArray()
}

interface CreateSnapshotInput {
  month: string
  netWorth: number
  totals: Snapshot['totals']
  byCategory: Snapshot['byCategory']
}

export async function createSnapshot(input: CreateSnapshotInput) {
  const db = await ensureDatabaseOpen()
  const snapshot: Snapshot = {
    id: createId('snap'),
    month: input.month,
    netWorth: input.netWorth,
    totals: input.totals,
    byCategory: input.byCategory,
    createdAt: dayjs().toISOString(),
  }
  await db.snapshots.put(snapshot)
  return snapshot
}
