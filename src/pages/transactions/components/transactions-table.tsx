import { useState } from 'react'
import dayjs from 'dayjs'
import { Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/hooks/use-toast'

const typeLabels: Record<string, string> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
}

const typeStyles: Record<string, string> = {
  income: 'bg-success/15 text-success',
  expense: 'bg-destructive/10 text-destructive',
  transfer: 'bg-blue-500/15 text-blue-500 dark:text-blue-400',
}

export function TransactionsTable() {
  const transactions = useAppStore((state) => state.transactions)
  const accounts = useAppStore((state) => state.accounts)
  const categories = useAppStore((state) => state.categories)
  const deleteTransaction = useAppStore((state) => state.deleteTransaction)
  const { toast } = useToast()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getAccountName = (id: string | null | undefined, fallback = 'Unknown') =>
    accounts.find((account) => account.id === id)?.name ?? fallback

  const getCategoryName = (id: string | null | undefined, fallback: string) =>
    categories.find((category) => category.id === id)?.name ?? fallback

  const resolveTransferNote = (transaction: (typeof transactions)[number]) => {
    if (transaction.type !== 'transfer') {
      return null
    }
    const sourceName = getAccountName(transaction.accountId, 'Source account')
    const destinationName = getAccountName(
      transaction.counterpartyAccountId ?? '',
      'Destination account',
    )
    return `Transfer from ${sourceName} to ${destinationName}`
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) {
      return
    }
    setIsDeleting(true)
    try {
      await deleteTransaction(pendingDeleteId)
      toast({
        title: 'Transaction deleted',
        description: 'The entry has been removed from your ledger.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to delete transaction',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setPendingDeleteId(null)
    }
  }

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
            <th className="px-6 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const badgeVariant = typeStyles[transaction.type] ?? 'bg-muted text-foreground'
            const amountDisplay = formatCurrency(transaction.amount)
            const isExpense = transaction.type === 'expense'
            const isIncome = transaction.type === 'income'
            const signPrefix = isExpense ? '-' : isIncome ? '+' : ''
            const destinationLabel =
              transaction.type === 'transfer'
                ? getAccountName(transaction.counterpartyAccountId ?? '', '—')
                : getCategoryName(transaction.categoryId ?? '', '—')
            const transferNote = resolveTransferNote(transaction)
            const noteDisplay = transaction.notes?.trim() || transferNote || '—'

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
                <td className="px-6 py-3 text-xs text-muted-foreground">{noteDisplay}</td>
                <td className="px-6 py-3 text-right">
                  <Dialog
                    open={pendingDeleteId === transaction.id}
                    onOpenChange={(open: boolean) =>
                      setPendingDeleteId(open ? transaction.id : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete this transaction?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone and will remove the entry from all reports.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" disabled={isDeleting}>
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          onClick={handleConfirmDelete}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </ScrollArea>
  )
}
