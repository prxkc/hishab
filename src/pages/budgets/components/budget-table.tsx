import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { DEFAULT_CURRENCY } from '@/domain/constants'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { selectBudgetUsage, selectMonthlyCashFlow } from '@/store/selectors'

export function BudgetTable() {
  const budgets = useAppStore(selectBudgetUsage)
  const categories = useAppStore((state) => state.categories)
  const cashFlow = useAppStore(selectMonthlyCashFlow)

  if (budgets.length === 0) {
    return (
      <EmptyState
        title="No budgets yet"
        description="Set allocations to keep spending in check."
      />
    )
  }

  const getCategoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? id

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
          </tr>
        </thead>
        <tbody className="divide-y divide-border/10">
          {budgets.map((budget) => (
            <tr key={budget.id} className="bg-card/80 backdrop-blur">
              <td className="px-4 py-4 text-foreground">
                <div className="flex flex-col">
                  <span className="font-medium">{getCategoryName(budget.categoryId)}</span>
                  <span className="text-xs text-muted-foreground">
                    {budget.amount === 0 ? 'No allocation yet' : `${Math.round(budget.progress * 100)}% used`}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-right text-muted-foreground">
                {formatCurrency(budget.amount, 'en-BD', DEFAULT_CURRENCY)}
              </td>
              <td className="px-4 py-4 text-right text-muted-foreground">
                {formatCurrency(budget.spent ?? 0, 'en-BD', DEFAULT_CURRENCY)}
              </td>
              <td className="px-4 py-4 text-right text-muted-foreground">
                {formatCurrency(budget.remaining ?? 0, 'en-BD', DEFAULT_CURRENCY)}
              </td>
              <td className="px-4 py-4">
                <Progress value={Math.min(100, (budget.progress ?? 0) * 100)} className="h-2 bg-primary/10" />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-black/20 text-sm">
          <tr>
            <td className="px-4 py-3 font-medium text-foreground">Totals</td>
            <td className="px-4 py-3 text-right font-semibold text-foreground">
              {formatCurrency(
                budgets.reduce((total, budget) => total + budget.amount, 0),
                'en-BD',
                DEFAULT_CURRENCY,
              )}
            </td>
            <td className="px-4 py-3 text-right font-semibold text-foreground">
              {formatCurrency(
                budgets.reduce((total, budget) => total + (budget.spent ?? 0), 0),
                'en-BD',
                DEFAULT_CURRENCY,
              )}
            </td>
            <td className="px-4 py-3 text-right font-semibold text-foreground">
              {formatCurrency(
                budgets.reduce((total, budget) => total + (budget.remaining ?? 0), 0),
                'en-BD',
                DEFAULT_CURRENCY,
              )}
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              Cash flow net: {formatCurrency(cashFlow.net, 'en-BD', DEFAULT_CURRENCY)} ({formatNumber(cashFlow.income)} /
              {formatNumber(cashFlow.expense)})
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
