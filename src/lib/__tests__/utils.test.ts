import { describe, expect, it } from 'vitest'

import { cn, formatCurrency, formatNumber } from '../utils'

describe('utils', () => {
  it('merges class names', () => {
    expect(cn('flex', undefined, 'items-center')).toBe('flex items-center')
  })

  it('formats currency with two decimals', () => {
    expect(formatCurrency(1234.5, 'en-BD')).toBe('1,234.50')
  })

  it('formats numbers with two decimals max', () => {
    expect(formatNumber(1234.567)).toBe('1,234.57')
    expect(formatNumber(987)).toBe('987')
  })
})
