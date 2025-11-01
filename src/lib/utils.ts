import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, locale = 'en-BD', currency = 'BDT') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(amount: number, locale = 'en-BD') {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(amount)
}
