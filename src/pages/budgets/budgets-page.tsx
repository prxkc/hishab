import { useState } from 'react'
import dayjs from 'dayjs'
import { History } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { MonthSwitcher } from '@/components/shared/month-switcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app-store'
import { selectSelectedMonth } from '@/store/selectors'
import { EditBudgetsSheet } from './components/edit-budgets-sheet'
import { BudgetTable } from './components/budget-table'

export function BudgetsPage() {
  const selectedMonth = useAppStore(selectSelectedMonth)
  const copyBudgetsFromPreviousMonth = useAppStore((state) => state.copyBudgetsFromPreviousMonth)
  const { toast } = useToast()
  const [isCopying, setIsCopying] = useState(false)

  const handleCopy = async () => {
    setIsCopying(true)
    try {
      await copyBudgetsFromPreviousMonth()
      toast({
        title: 'Budgets copied',
        description: `Imported previous month allocations into ${dayjs(selectedMonth, 'YYYY-MM').format('MMMM YYYY')}.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to copy budgets',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Budgets"
        description="Allocate monthly spending envelopes, stay on top of burn rates, and clone last month's plan in a click."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthSwitcher />
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy} disabled={isCopying}>
              <History className="h-4 w-4" />
              Copy Previous Month
            </Button>
            <EditBudgetsSheet />
          </div>
        }
      />

      <Card className="border border-border/40 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Monthly Overview</CardTitle>
          <CardDescription>
            See allocations, actual spend, and remaining amounts for each envelope.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetTable />
        </CardContent>
      </Card>
    </div>
  )
}
