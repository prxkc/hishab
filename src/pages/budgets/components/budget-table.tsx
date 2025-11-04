import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
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
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { selectBudgetUsage, selectMonthlyCashFlow } from '@/store/selectors'
import { useToast } from '@/hooks/use-toast'

export function BudgetTable() {
  const budgets = useAppStore(selectBudgetUsage)
  const categories = useAppStore((state) => state.categories)
  const cashFlow = useAppStore(selectMonthlyCashFlow)
  const deleteBudget = useAppStore((state) => state.deleteBudget)
  const { toast } = useToast()
  const [pendingBudgetId, setPendingBudgetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  if (budgets.length === 0) {
    return (
      <EmptyState title="No budgets yet" description="Set allocations to keep spending in check." />
    )
  }

  const getCategoryName = (id: string) =>
    categories.find((category) => category.id === id)?.name ?? id
  const handleDeleteBudget = async () => {
    if (!pendingBudgetId) {
      return
    }
    setIsDeleting(true)
    try {
      await deleteBudget(pendingBudgetId)
      toast({
        title: 'Budget deleted',
        description: 'The category allocation has been removed for this month.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to delete budget',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setPendingBudgetId(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/30">
      <table className="min-w-full divide-y divide-border/20 text-sm">
        <thead className="bg-black/20 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-right font-medium">Allocated</th>
            <th className="px-4 py-3 text-right font-medium">Spent</th>
            <th className="px-4 py-3 text-right font-medium">Remaining</th>
            <th className="px-4 py-3 text-left font-medium">Progress</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/10">
          {budgets.map((budget) => (
            <tr key={budget.id} className="bg-card/80 backdrop-blur">
              <td className="px-4 py-4 text-foreground">
                <div className="flex flex-col">
                  <span className="font-medium">{getCategoryName(budget.categoryId)}</span>
                  <span className="text-xs text-muted-foreground">
                    {budget.amount === 0
                      ? 'No allocation yet'
                      : `${Math.round(budget.progress * 100)}% used`}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-right font-money text-muted-foreground">
                {formatCurrency(budget.amount)}
              </td>
              <td className="px-4 py-4 text-right font-money text-muted-foreground">
                {formatCurrency(budget.spent ?? 0)}
              </td>
              <td className="px-4 py-4 text-right font-money text-muted-foreground">
                {formatCurrency(budget.remaining ?? 0)}
              </td>
              <td className="px-4 py-4">
                <Progress
                  value={Math.min(100, (budget.progress ?? 0) * 100)}
                  className="h-2 bg-primary/10"
                />
              </td>
              <td className="px-4 py-4 text-right">
                <Dialog
                  open={pendingBudgetId === budget.id}
                  onOpenChange={(open: boolean) => setPendingBudgetId(open ? budget.id : null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete budget for ${getCategoryName(budget.categoryId)}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete this allocation?</DialogTitle>
                      <DialogDescription>
                        {getCategoryName(budget.categoryId)} will have no budget for the selected
                        month.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" disabled={isDeleting}>
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={handleDeleteBudget}
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
          ))}
        </tbody>
        <tfoot className="bg-black/20 text-sm">
          <tr>
            <td className="px-4 py-3 font-medium text-foreground">Totals</td>
            <td className="px-4 py-3 text-right font-money font-semibold text-foreground">
              {formatCurrency(budgets.reduce((total, budget) => total + budget.amount, 0))}
            </td>
            <td className="px-4 py-3 text-right font-money font-semibold text-foreground">
              {formatCurrency(budgets.reduce((total, budget) => total + (budget.spent ?? 0), 0))}
            </td>
            <td className="px-4 py-3 text-right font-money font-semibold text-foreground">
              {formatCurrency(
                budgets.reduce((total, budget) => total + (budget.remaining ?? 0), 0),
              )}
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              Cash flow net: <span className="font-money">{formatCurrency(cashFlow.net)}</span> (
              {formatNumber(cashFlow.income)} / {formatNumber(cashFlow.expense)})
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
