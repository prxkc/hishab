import dayjs from 'dayjs'

import type { Category } from '@/domain/types'
import { createId } from '@/lib/id'
import { ensureDatabaseOpen } from '../db'

export async function getCategories() {
  const db = await ensureDatabaseOpen()
  return db.categories.orderBy('name').toArray()
}

export async function getCategoryById(id: string) {
  const db = await ensureDatabaseOpen()
  return db.categories.get(id)
}

interface CreateCategoryInput {
  name: string
  type: Category['type']
  parentId?: string | null
}

export async function createCategory(input: CreateCategoryInput) {
  const db = await ensureDatabaseOpen()
  const timestamp = dayjs().toISOString()
  const category: Category = {
    id: createId('cat'),
    name: input.name,
    type: input.type,
    parentId: input.parentId ?? null,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.categories.put(category)
  return category
}

interface UpdateCategoryInput {
  id: string
  name?: string
  parentId?: string | null
  archived?: boolean
}

export async function updateCategory(input: UpdateCategoryInput) {
  const db = await ensureDatabaseOpen()
  const existing = await db.categories.get(input.id)
  if (!existing) {
    throw new Error('Category not found')
  }
  const updated: Category = {
    ...existing,
    ...('name' in input && input.name !== undefined ? { name: input.name } : {}),
    ...('parentId' in input ? { parentId: input.parentId ?? null } : {}),
    ...('archived' in input && input.archived !== undefined ? { archived: input.archived } : {}),
    updatedAt: dayjs().toISOString(),
  }
  await db.categories.put(updated)
  return updated
}

export async function deleteCategory(id: string) {
  const db = await ensureDatabaseOpen()
  await db.categories.delete(id)
}
