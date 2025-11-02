import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { EChartsOption } from 'echarts'
import { ArrowDownRight, ArrowUpRight, Trash2, TrendingUp } from 'lucide-react'

import { EChart } from '@/components/charts/echart'
import { Progress } from '@/components/ui/progress'
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
import { MonthSwitcher } from '@/components/shared/month-switcher'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app-store'
import { NewAccountForm } from '@/pages/settings/components/new-account-form'
import {
  selectBudgetUsage,
  selectFormattedNetWorth,
  selectMonthlyCashFlow,
  selectNetWorth,
  selectSelectedMonth,
} from '@/store/selectors'
import type { Account } from '@/domain/types'

type ChartCallbackParams = {
  dataIndex: number
  value: unknown
  name?: string
}

export function DashboardPage() {
  const selectedMonth = useAppStore(selectSelectedMonth)
  const netWorthValue = useAppStore(selectNetWorth)
  const netWorth = useAppStore(selectFormattedNetWorth)
  const cashFlow = useAppStore(selectMonthlyCashFlow)
  const budgets = useAppStore(selectBudgetUsage)
  const categories = useAppStore((state) => state.categories)
  const accounts = useAppStore((state) => state.accounts)
  const transactions = useAppStore((state) => state.transactions)
  const deleteAccount = useAppStore((state) => state.deleteAccount)
  const { toast } = useToast()
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const accountTypeLabels: Record<Account['type'], string> = {
    cash: 'Cash',
    bank: 'Bank',
    wallet: 'Wallet',
  }

  const isChartCallbackParams = (input: unknown): input is ChartCallbackParams => {
    if (typeof input !== 'object' || input === null) {
      return false
    }
    const candidate = input as Record<string, unknown>
    return typeof candidate.dataIndex === 'number'
  }

  const handleAccountDelete = async (id: string) => {
    setIsDeletingAccount(true)
    try {
      await deleteAccount(id)
      toast({
        title: 'Account removed',
        description: 'Balances and dashboards have been refreshed.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to delete account',
        description:
          error instanceof Error ? error.message : 'Remove related transactions and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingAccount(false)
      setAccountToDelete(null)
    }
  }

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return transactions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
  }, [transactions])

  // Weekly expenses for current month
  const weeklyExpensesData = useMemo(() => {
    const currentMonthStart = dayjs(selectedMonth).startOf('month')
    const currentMonthEnd = dayjs(selectedMonth).endOf('month')

    // Get all expense transactions for current month
    const monthExpenses = transactions.filter(
      (tx) =>
        tx.type === 'expense' &&
        dayjs(tx.date).isAfter(currentMonthStart.subtract(1, 'day')) &&
        dayjs(tx.date).isBefore(currentMonthEnd.add(1, 'day')),
    )

    // Group by week
    const weeks: { label: string; amount: number }[] = []
    let weekStart = currentMonthStart.startOf('week')

    while (weekStart.isBefore(currentMonthEnd)) {
      const weekEnd = weekStart.endOf('week')
      const weekExpenses = monthExpenses.filter((tx) => {
        const txDate = dayjs(tx.date)
        return (
          txDate.isAfter(weekStart.subtract(1, 'day')) && txDate.isBefore(weekEnd.add(1, 'day'))
        )
      })

      const total = weekExpenses.reduce((sum, tx) => sum + tx.amount, 0)
      weeks.push({
        label: `Week ${weeks.length + 1}`,
        amount: total,
      })

      weekStart = weekStart.add(1, 'week')
    }

    return weeks
  }, [transactions, selectedMonth])

  const weeklyExpensesOption = useMemo<EChartsOption>(() => {
    const extractNumericValue = (value: ChartCallbackParams['value']) => {
      if (Array.isArray(value) && value.length > 0) {
        const firstValue: unknown = value[0]
        if (typeof firstValue === 'number') {
          return firstValue
        }
        const numeric = Number(firstValue ?? 0)
        return Number.isFinite(numeric) ? numeric : 0
      }
      if (value instanceof Date) {
        return value.valueOf()
      }
      if (typeof value === 'object' && value !== null && 'value' in value) {
        const candidate = (value as { value?: unknown }).value
        return typeof candidate === 'number' ? candidate : Number(candidate ?? 0)
      }
      if (typeof value === 'number') {
        return value
      }
      return Number(value ?? 0)
    }

    const maxValue = Math.max(...weeklyExpensesData.map((w) => w.amount), 0)
    const highlightIndex = weeklyExpensesData.length > 0 ? weeklyExpensesData.length - 1 : 0

    return {
      grid: {
        left: 16,
        right: 16,
        top: 40,
        bottom: 40,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: weeklyExpensesData.map((w) => w.label),
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#999',
          fontSize: 11,
          margin: 16,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#e5e5e5',
            type: 'dashed',
            width: 1,
          },
        },
      },
      yAxis: {
        type: 'value',
        show: false,
        max: maxValue * 1.3,
      },
      series: [
        {
          type: 'line',
          data: weeklyExpensesData.map((w) => w.amount),
          smooth: true,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: (_value: unknown, params: { dataIndex: number }) => {
            return params.dataIndex === highlightIndex ? 8 : 0
          },
          lineStyle: {
            width: 3,
            color: '#000',
          },
          itemStyle: {
            color: '#000',
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: ChartCallbackParams) => {
              if (params.dataIndex === highlightIndex) {
                const value = extractNumericValue(params.value)
                return formatCurrency(value)
              }
              return ''
            },
            color: '#000',
            fontSize: 13,
            fontWeight: 'bold',
            offset: [0, -10],
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (rawParams: unknown) => {
          let firstParam: ChartCallbackParams | undefined
          if (
            Array.isArray(rawParams) &&
            rawParams.length > 0 &&
            isChartCallbackParams(rawParams[0])
          ) {
            firstParam = rawParams[0]
          }
          const value = extractNumericValue(firstParam?.value)
          const label = typeof firstParam?.name === 'string' ? firstParam.name : 'Week'
          return `${label}<br/>Expenses: ${formatCurrency(value)}`
        },
      },
    }
  }, [weeklyExpensesData])

  // Spending by category
  const categoryOption = useMemo<EChartsOption>(() => {
    const getCategoryName = (categoryId: string) => {
      const match = categories.find((category) => category.id === categoryId)
      return match ? match.name : categoryId
    }
    const expenseBudgets = budgets.filter((budget) => budget.amount > 0)
    const sorted = expenseBudgets.sort((a, b) => (b.spent ?? 0) - (a.spent ?? 0)).slice(0, 5)
    return {
      tooltip: {
        trigger: 'item',
        formatter: (rawParams: unknown) => {
          const params = rawParams as {
            name?: string
            value?: number | string | null
            percent?: number
          }
          const amount = typeof params.value === 'number' ? params.value : Number(params.value ?? 0)
          const pct = typeof params.percent === 'number' ? params.percent : 0
          const label = params.name ?? 'Category'
          return `${label}<br/>Spent: ${formatCurrency(amount)} (${pct.toFixed(1)}%)`
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11,
          },
          data: sorted.map((budget) => ({
            name: getCategoryName(budget.categoryId),
            value: budget.spent,
          })),
        },
      ],
    }
  }, [budgets, categories])

  // Calculate extra balance after budget expenses (total balance - sum of budget allocations)
  const totalBudgetAllocated = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const extraBalanceAfterBudgets = netWorthValue - totalBudgetAllocated

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dayjs().format('dddd, D MMMM YYYY')}
          </p>
        </div>
        <MonthSwitcher />
      </div>

      {/* Total Balance and Extra Balance Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Total Balance Card */}
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Title and Balance */}
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Total Balance</p>
                <p className="text-4xl font-bold tracking-tight text-foreground">{netWorth}</p>
              </div>

              {/* Income and Expense Boxes */}
              <div className="flex items-center gap-3">
                {/* Income Box */}
                <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/20">
                    <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">
                      {formatCurrency(cashFlow.income)}
                    </p>
                    <p className="text-xs text-muted-foreground">Income</p>
                  </div>
                </div>

                {/* Expense Box */}
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/20">
                    <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">
                      {formatCurrency(cashFlow.expense)}
                    </p>
                    <p className="text-xs text-muted-foreground">Expenses</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extra Balance After Budgets Card */}
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Extra Balance After Budgets</p>
                <p className="text-4xl font-bold tracking-tight text-foreground">
                  {formatCurrency(extraBalanceAfterBudgets)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>
                  Available after covering {formatCurrency(totalBudgetAllocated)} in budgets
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">Accounts</h2>
            <p className="text-xs text-muted-foreground">
              Balances update instantly as you add, edit, or remove accounts.
            </p>
          </div>
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add account</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg border border-border/40 bg-card/95 backdrop-blur">
              <DialogHeader>
                <DialogTitle>Add a new account</DialogTitle>
                <DialogDescription>
                  Track additional banks, wallets, or cash stashes in one place.
                </DialogDescription>
              </DialogHeader>
              <NewAccountForm
                onSuccess={() => setIsAddAccountOpen(false)}
                submitLabel="Create account"
              />
            </DialogContent>
          </Dialog>
        </div>
        {accounts.length === 0 ? (
          <EmptyState
            title="No accounts yet"
            description="Add your first bank, wallet, or cash balance to get started."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className="h-full rounded-2xl border border-border/20 bg-card shadow-sm"
              >
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Balance {formatCurrency(account.balance)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {accountTypeLabels[account.type]}
                    </Badge>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <span>Updated {dayjs(account.updatedAt).format('MMM D, YYYY')}</span>
                    <Dialog
                      open={accountToDelete?.id === account.id}
                      onOpenChange={(open) => setAccountToDelete(open ? account : null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove account</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Remove this account?</DialogTitle>
                          <DialogDescription>
                            {account.name} will disappear from the dashboard once removed.
                            Transactions that reference it should be reassigned or deleted first.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" disabled={isDeletingAccount}>
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button
                            onClick={() => handleAccountDelete(account.id)}
                            disabled={isDeletingAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Weekly Expenses & Recent Transactions */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        {/* Weekly Expenses */}
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="mb-3">
              <h3 className="text-base font-bold text-foreground">Weekly expenses</h3>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Expenses</span>
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              </div>
            </div>
            <div className="h-[180px]">
              {weeklyExpensesData.length > 0 ? (
                <EChart option={weeklyExpensesOption} aria-label="Weekly expenses" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No expenses this month
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => {
                  const category = categories.find((c) => c.id === tx.categoryId)
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between border-b border-border py-2 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            tx.type === 'income' ? 'bg-success/10' : 'bg-primary/10'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="h-4 w-4 text-success" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {tx.notes || category?.name || tx.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dayjs(tx.date).format('MMM DD, YYYY')}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-sm font-semibold ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  )
                })
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No transactions yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending by Category & Budget Status */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Spending by Category */}
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {budgets.length > 0 ? (
                <EChart option={categoryOption} aria-label="Spending by category" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No spending data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Budget Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgets.slice(0, 5).map((budget) => {
                const category = categories.find((c) => c.id === budget.categoryId)
                const percentage = Math.min(100, budget.progress * 100)
                const isOverBudget = percentage >= 100
                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {category?.name || budget.categoryId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(budget.spent ?? 0)} / {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={percentage}
                        className={`h-2 ${isOverBudget ? 'bg-destructive/20' : 'bg-primary/20'}`}
                      />
                      <span className="absolute -top-5 right-0 text-xs font-medium text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )
              })}
              {budgets.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No budgets set yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
