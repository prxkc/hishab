import dayjs from 'dayjs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/shared/empty-state'
import { DEFAULT_CURRENCY } from '@/domain/constants'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

const typeLabels: Record<string, string> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
}

const typeStyles: Record<string, string> = {
  income: 'bg-success/15 text-success',
  expense: 'bg-destructive/10 text-destructive',
  transfer: 'bg-primary/15 text-primary',
}

export function TransactionsTable() {
  const transactions = useAppStore((state) => state.transactions)
  const accounts = useAppStore((state) => state.accounts)
  const categories = useAppStore((state) => state.categories)

  const getAccountName = (id: string | null | undefined, fallback = 'Unknown') =>
    accounts.find((account) => account.id === id)?.name ?? fallback

  const getCategoryName = (id: string | null | undefined, fallback: string) =>
    categories.find((category) => category.id === id)?.name ?? fallback

  if (transactions.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          title="No transactions yet"
          description="Once you add income, expenses, or transfers, they will appear here."
        />
      </div>
    )
  }

  return (
    <ScrollArea className="h-[520px]">
      <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-black/20">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-left font-medium">Type</th>
                <th className="px-6 py-3 text-left font-medium">Account</th>
                <th className="px-6 py-3 text-left font-medium">Category / To</th>
                <th className="px-6 py-3 text-right font-medium">Amount</th>
                <th className="px-6 py-3 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const badgeVariant = typeStyles[transaction.type] ?? 'bg-muted text-foreground'
                const amountDisplay = formatCurrency(transaction.amount, 'en-BD', DEFAULT_CURRENCY)
                const isExpense = transaction.type === 'expense'
                const isIncome = transaction.type === 'income'
                const signPrefix = isExpense ? '-' : isIncome ? '+' : ''
                const destinationLabel =
                  transaction.type === 'transfer'
                    ? getAccountName(transaction.counterpartyAccountId ?? '', '—')
                    : getCategoryName(transaction.categoryId ?? '', '—')

                return (
                  <tr key={transaction.id} className="border-t border-border/10">
                    <td className="px-6 py-3 text-foreground/90">
                      {dayjs(transaction.date).format('MMM D, YYYY')}
                    </td>
                    <td className="px-6 py-3">
                      <Badge className={badgeVariant}>{typeLabels[transaction.type] ?? 'Other'}</Badge>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {getAccountName(transaction.accountId)}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{destinationLabel}</td>
                    <td className="px-6 py-3 text-right font-medium text-foreground">
                      <span className={isExpense ? 'text-destructive' : isIncome ? 'text-success' : ''}>
                        {signPrefix}
                        {amountDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">
                      {transaction.notes ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
      </table>
    </ScrollArea>
  )
}
