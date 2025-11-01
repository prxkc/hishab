import { FileDown } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { MonthSwitcher } from '@/components/shared/month-switcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NewTransactionDialog } from './components/new-transaction-dialog'
import { TransactionsTable } from './components/transactions-table'

export function TransactionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ledger"
        title="Transactions"
        description="Record income, expenses, and transfers across accounts. Everything syncs instantly with your budgets."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthSwitcher />
            <Button variant="outline" size="sm" disabled className="gap-2">
              <FileDown className="h-4 w-4" />
              Import CSV
            </Button>
            <NewTransactionDialog />
          </div>
        }
      />

      <Card className="border border-border/40 bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>
              Sorted by date. Transfers adjust both accounts automatically.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TransactionsTable />
        </CardContent>
      </Card>
    </div>
  )
}
