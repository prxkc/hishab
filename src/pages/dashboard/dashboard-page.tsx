import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { EChartsOption } from 'echarts'
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react'

import { EChart } from '@/components/charts/echart'
import { Progress } from '@/components/ui/progress'
import { MonthSwitcher } from '@/components/shared/month-switcher'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEFAULT_CURRENCY } from '@/domain/constants'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import {
  selectBudgetUsage,
  selectFormattedNetWorth,
  selectMonthlyCashFlow,
  selectNetWorth,
  selectSelectedMonth,
} from '@/store/selectors'

export function DashboardPage() {
  const selectedMonth = useAppStore(selectSelectedMonth)
  const netWorthValue = useAppStore(selectNetWorth)
  const netWorth = useAppStore(selectFormattedNetWorth)
  const cashFlow = useAppStore(selectMonthlyCashFlow)
  const budgets = useAppStore(selectBudgetUsage)
  const categories = useAppStore((state) => state.categories)
  const accounts = useAppStore((state) => state.accounts)
  const transactions = useAppStore((state) => state.transactions)

  // Calculate account balances
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {}
    accounts.forEach((acc) => {
      balances[acc.id] = acc.balance
    })

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        balances[tx.accountId] = (balances[tx.accountId] ?? 0) + tx.amount
      } else if (tx.type === 'expense') {
        balances[tx.accountId] = (balances[tx.accountId] ?? 0) - tx.amount
      } else if (tx.type === 'transfer') {
        const fromId = tx.fromAccountId as string | undefined
        const toId = tx.toAccountId as string | undefined
        if (fromId && toId && typeof fromId === 'string' && typeof toId === 'string') {
          balances[fromId] = (balances[fromId] ?? 0) - tx.amount
          balances[toId] = (balances[toId] ?? 0) + tx.amount
        }
      }
    })

    return balances
  }, [accounts, transactions])

  // Get specific accounts
  const bankAccount = accounts.find((a) => a.type === 'bank')
  const bkashAccount = accounts.find((a) => a.type === 'bkash')
  const cashAccount = accounts.find((a) => a.type === 'cash')

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
          symbolSize: (value: unknown, params: { dataIndex: number }) => {
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
            formatter: (params: { dataIndex: number; value?: number | string | null }) => {
              if (params.dataIndex === highlightIndex) {
                const value =
                  typeof params.value === 'number' ? params.value : Number(params.value ?? 0)
                return formatCurrency(value, 'en-BD', DEFAULT_CURRENCY)
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
        formatter: (params: unknown) => {
          const param = (params as Array<{ name?: string; value?: number | string | null }>)[0]
          const value = typeof param?.value === 'number' ? param.value : Number(param?.value ?? 0)
          return `${param?.name}<br/>Expenses: ${formatCurrency(value, 'en-BD', DEFAULT_CURRENCY)}`
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
          return `${label}<br/>Spent: ${formatCurrency(amount, 'en-BD', DEFAULT_CURRENCY)} (${pct.toFixed(1)}%)`
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
                      {formatCurrency(cashFlow.income, 'en-BD', DEFAULT_CURRENCY)}
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
                      {formatCurrency(cashFlow.expense, 'en-BD', DEFAULT_CURRENCY)}
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
                  {formatCurrency(extraBalanceAfterBudgets, 'en-BD', DEFAULT_CURRENCY)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>
                  Available after covering{' '}
                  {formatCurrency(totalBudgetAllocated, 'en-BD', DEFAULT_CURRENCY)} in budgets
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Bank Asia */}
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Bank Asia</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {bankAccount
                  ? formatCurrency(accountBalances[bankAccount.id] ?? 0, 'en-BD', DEFAULT_CURRENCY)
                  : formatCurrency(0, 'en-BD', DEFAULT_CURRENCY)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bkash */}
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Bkash</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {bkashAccount
                  ? formatCurrency(accountBalances[bkashAccount.id] ?? 0, 'en-BD', DEFAULT_CURRENCY)
                  : formatCurrency(0, 'en-BD', DEFAULT_CURRENCY)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cash */}
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Cash</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {cashAccount
                  ? formatCurrency(accountBalances[cashAccount.id] ?? 0, 'en-BD', DEFAULT_CURRENCY)
                  : formatCurrency(0, 'en-BD', DEFAULT_CURRENCY)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                        {formatCurrency(tx.amount, 'en-BD', DEFAULT_CURRENCY)}
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
                        {formatCurrency(budget.spent ?? 0, 'en-BD', DEFAULT_CURRENCY)} /{' '}
                        {formatCurrency(budget.amount, 'en-BD', DEFAULT_CURRENCY)}
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
