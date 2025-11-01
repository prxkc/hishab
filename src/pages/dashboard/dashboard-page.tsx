import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { EChartsOption } from 'echarts'
import { PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'

import { ChartCard } from '@/components/shared/chart-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EChart } from '@/components/charts/echart'
import { Progress } from '@/components/ui/progress'
import { MonthSwitcher } from '@/components/shared/month-switcher'
import { DEFAULT_CURRENCY } from '@/domain/constants'
import { formatCurrency, formatNumber } from '@/lib/utils'
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
  const snapshots = useAppStore((state) => state.snapshots)
  const goals = useAppStore((state) => state.goals)
  const categories = useAppStore((state) => state.categories)
  const accountCount = useAppStore((state) => state.accounts.length)

  const goalsSummary = useMemo(() => {
    if (goals.length === 0) {
      return {
        target: 0,
        allocated: 0,
        completion: 0,
      }
    }
    const target = goals.reduce((total, goal) => total + goal.targetAmount, 0)
    const allocated = goals.reduce((total, goal) => total + goal.currentAllocated, 0)
    const completion = target > 0 ? allocated / target : 0
    return { target, allocated, completion }
  }, [goals])

  const netWorthOption = useMemo<EChartsOption>(() => {
    const baseSeries = snapshots
      .slice()
      .reverse()
      .map((snapshot) => ({
        month: snapshot.month,
        value: snapshot.netWorth,
      }))

    const currentMonth = dayjs(selectedMonth).format('YYYY-MM')
    const hasCurrent = baseSeries.some((item) => item.month === currentMonth)
    const data = hasCurrent
      ? baseSeries
      : [...baseSeries, { month: currentMonth, value: netWorthValue }]

    return {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.month),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatNumber(value / 1000) + 'k',
        },
      },
      series: [
        {
          name: 'Net Worth',
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3 },
          areaStyle: {
            opacity: 0.2,
          },
          data: data.map((item) => item.value),
        },
      ],
      grid: { left: 16, right: 16, top: 36, bottom: 40, containLabel: true },
    }
  }, [netWorthValue, selectedMonth, snapshots])

  const cashFlowOption = useMemo<EChartsOption>(() => {
    const categories = ['Income', 'Expense', 'Net']
    const values = [cashFlow.income, cashFlow.expense, cashFlow.net]
    const colors = ['#34d399', '#f87171', '#60a5fa']
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      xAxis: {
        type: 'category',
        data: categories,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatNumber(value),
        },
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: {
            color: (params: { dataIndex: number }) => colors[params.dataIndex] ?? colors[0],
            borderRadius: 8,
          },
          label: {
            show: true,
            position: 'top',
            formatter: (rawParams: unknown) => {
              const params = rawParams as { value?: number | string | null }
              const amount =
                typeof params.value === 'number' ? params.value : Number(params.value ?? 0)
              return formatNumber(amount)
            },
          },
          barWidth: '45%',
        },
      ],
      grid: { left: 24, right: 16, top: 32, bottom: 32, containLabel: true },
    }
  }, [cashFlow])

  const categoryOption = useMemo<EChartsOption>(() => {
    const getCategoryName = (categoryId: string) => {
      const match = categories.find((category) => category.id === categoryId)
      return match ? match.name : categoryId
    }
    const expenseBudgets = budgets.filter((budget) => budget.amount > 0)
    const sorted = expenseBudgets
      .sort((a, b) => (b.spent ?? 0) - (a.spent ?? 0))
      .slice(0, 6)
    return {
      tooltip: {
        trigger: 'item',
        formatter: (rawParams: unknown) => {
          const params = rawParams as { name?: string; value?: number | string | null; percent?: number }
          const amount = typeof params.value === 'number' ? params.value : Number(params.value ?? 0)
          const pct = typeof params.percent === 'number' ? params.percent : 0
          const label = params.name ?? 'Category'
          return `${label}<br/>Spent: ${formatCurrency(amount, 'en-BD', DEFAULT_CURRENCY)} (${pct}%)`
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['30%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#0f172a', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%' },
          data: sorted.map((budget) => ({
            name: getCategoryName(budget.categoryId),
            value: budget.spent,
          })),
        },
      ],
    }
  }, [budgets, categories])

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Overview"
        title="Financial Pulse"
        description="Your consolidated snapshot for balances, cash flow, and goals. Everything is stored locally on this device."
        actions={<MonthSwitcher />}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net Worth"
          value={netWorth}
          description={`Across ${formatNumber(accountCount)} accounts`}
          icon={<TrendingUp className="h-6 w-6" strokeWidth={1.6} />}
        />
        <StatCard
          label="Monthly Income"
          value={formatCurrency(cashFlow.income, 'en-BD', DEFAULT_CURRENCY)}
          delta={{
            value:
              cashFlow.net >= 0
                ? `Net +${formatCurrency(cashFlow.net, 'en-BD', DEFAULT_CURRENCY)}`
                : `Net ${formatCurrency(cashFlow.net, 'en-BD', DEFAULT_CURRENCY)}`,
            positive: cashFlow.net >= 0,
          }}
          icon={<TrendingUp className="h-6 w-6" strokeWidth={1.6} />}
        />
        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(cashFlow.expense, 'en-BD', DEFAULT_CURRENCY)}
          delta={{
            value: `${formatNumber(budgets.length)} budget categories`,
            positive: false,
          }}
          icon={<TrendingDown className="h-6 w-6" strokeWidth={1.6} />}
        />
        <StatCard
          label="Goals Progress"
          value={formatCurrency(goalsSummary.allocated, 'en-BD', DEFAULT_CURRENCY)}
          description={`Target ${formatCurrency(goalsSummary.target, 'en-BD', DEFAULT_CURRENCY)}`}
          icon={<PiggyBank className="h-6 w-6" strokeWidth={1.6} />}
          delta={{
            value: `${Math.round(goalsSummary.completion * 100)}% funded`,
            positive: true,
          }}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <ChartCard
          title="Net Worth"
          description={`Rolling trend up to ${dayjs(selectedMonth).format('MMMM YYYY')}`}
        >
          <EChart option={netWorthOption} aria-label="Net worth trend" />
        </ChartCard>
        <ChartCard title="Budget Utilization" description="Track spend vs allocation per category">
          <div className="flex h-full flex-col gap-4 overflow-y-auto pr-2">
            {budgets.slice(0, 6).map((budget) => (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{budget.categoryId}</span>
                  <span className="font-medium">
                    {formatCurrency(budget.spent, 'en-BD', DEFAULT_CURRENCY)} /{' '}
                    {formatCurrency(budget.amount, 'en-BD', DEFAULT_CURRENCY)}
                  </span>
                </div>
                <Progress value={Math.min(100, budget.progress * 100)} className="h-2 bg-primary/10" />
              </div>
            ))}
            {budgets.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Budgets will appear here once created.
              </div>
            ) : null}
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Cash Flow"
          description={`Income vs expense for ${dayjs(selectedMonth).format('MMMM YYYY')}`}
        >
          <EChart option={cashFlowOption} aria-label="Cash flow comparison" />
        </ChartCard>
        <ChartCard title="Top Categories" description="Highest spending categories this month">
          <EChart option={categoryOption} aria-label="Top spending categories" />
        </ChartCard>
      </section>
    </div>
  )
}
