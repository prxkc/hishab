import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import type { EChartsOption } from 'echarts'

import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { StatCard } from '@/components/shared/stat-card'
import { EChart } from '@/components/charts/echart'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DEFAULT_CURRENCY } from '@/domain/constants'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import {
  selectBudgetUsage,
  selectMonthlyCashFlow,
  selectNetWorth,
  selectSelectedMonth,
} from '@/store/selectors'

dayjs.extend(isBetween)

const rangeOptions = [3, 6, 12]

export function ReportsPage() {
  const [monthsRange, setMonthsRange] = useState(6)
  const selectedMonth = useAppStore(selectSelectedMonth)
  const netWorthCurrent = useAppStore(selectNetWorth)
  const cashFlowCurrent = useAppStore(selectMonthlyCashFlow)
  const budgets = useAppStore(selectBudgetUsage)
  const snapshots = useAppStore((state) => state.snapshots)
  const transactions = useAppStore((state) => state.transactions)
  const categories = useAppStore((state) => state.categories)

  const months = useMemo(() => {
    const end = dayjs(selectedMonth, 'YYYY-MM').endOf('month')
    return Array.from({ length: monthsRange }, (_, index) => end.subtract(monthsRange - index - 1, 'month'))
  }, [monthsRange, selectedMonth])

  const netWorthOption = useMemo<EChartsOption>(() => {
    const data = months.map((month) => {
      const key = month.format('YYYY-MM')
      const snapshot = snapshots.find((item) => item.month === key)
      return snapshot?.netWorth ?? netWorthCurrent
    })

    return {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: months.map((month) => month.format('MMM YY')),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `${formatNumber(value / 1000)}k`,
        },
      },
      series: [
        {
          name: 'Net worth',
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.15 },
          data,
        },
      ],
    }
  }, [months, netWorthCurrent, snapshots])

  const cashFlowOption = useMemo<EChartsOption>(() => {
    const monthly = months.map((month) => {
      const start = month.startOf('month')
      const end = month.endOf('month')
      let income = 0
      let expense = 0
      transactions.forEach((transaction) => {
        const date = dayjs(transaction.date)
        if (!date.isBetween(start, end, null, '[]')) {
          return
        }
        if (transaction.type === 'income') {
          income += transaction.amount
        }
        if (transaction.type === 'expense') {
          expense += transaction.amount
        }
      })
      return {
        month: month.format('MMM YY'),
        income,
        expense,
        net: income - expense,
      }
    })

    return {
      legend: { top: 0 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: monthly.map((item) => item.month),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatNumber(value / 1000) + 'k',
        },
      },
      series: [
        {
          name: 'Income',
          type: 'bar',
          data: monthly.map((item) => item.income),
          itemStyle: { color: '#34d399', borderRadius: 6 },
        },
        {
          name: 'Expense',
          type: 'bar',
          data: monthly.map((item) => item.expense),
          itemStyle: { color: '#f87171', borderRadius: 6 },
        },
        {
          name: 'Net',
          type: 'line',
          data: monthly.map((item) => item.net),
          smooth: true,
          showSymbol: true,
          lineStyle: { width: 2 },
        },
      ],
    }
  }, [months, transactions])

  const categoriesOption = useMemo<EChartsOption>(() => {
    const start = months[0]?.startOf('month')
    const end = months[months.length - 1]?.endOf('month')
    const totals = new Map<string, number>()

    transactions.forEach((transaction) => {
      if (transaction.type !== 'expense' || !transaction.categoryId) {
        return
      }
      const date = dayjs(transaction.date)
      if (!start || !end || !date.isBetween(start, end, null, '[]')) {
        return
      }
      totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount)
    })

    const sorted = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    const labels = sorted.map(([categoryId]) => {
      const category = categories.find((item) => item.id === categoryId)
      return category?.name ?? categoryId
    })
    const values = sorted.map(([, amount]) => amount)

    return {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { interval: 0, rotate: 20 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatNumber(value),
        },
      },
      series: [
        {
          name: 'Spend',
          type: 'bar',
          data: values,
          itemStyle: { color: '#60a5fa', borderRadius: 6 },
        },
      ],
    }
  }, [categories, months, transactions])

  const budgetBurnOption = useMemo<EChartsOption>(() => {
    const labels = budgets.slice(0, 8).map((budget) => {
      const category = categories.find((item) => item.id === budget.categoryId)
      return category?.name ?? budget.categoryId
    })
    const allocated = budgets.slice(0, 8).map((budget) => budget.amount)
    const spent = budgets.slice(0, 8).map((budget) => budget.spent ?? 0)

    return {
      legend: { top: 0 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { interval: 0, rotate: 20 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatNumber(value),
        },
      },
      series: [
        {
          name: 'Allocated',
          type: 'bar',
          data: allocated,
          itemStyle: { color: '#0ea5e9', borderRadius: 6 },
        },
        {
          name: 'Spent',
          type: 'bar',
          data: spent,
          itemStyle: { color: '#f97316', borderRadius: 6 },
        },
      ],
    }
  }, [budgets, categories])

  const totalExpenseRange = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Visualize trends, compare time ranges, and surface opportunities to optimise spending across your local-first finances."
        actions={
          <div className="flex items-center gap-3">
            <Select
              value={monthsRange.toString()}
              onValueChange={(value) => setMonthsRange(Number(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                {rangeOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    Last {option} months
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled>
              Export PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Current net worth"
          value={formatCurrency(netWorthCurrent, 'en-BD', DEFAULT_CURRENCY)}
          description={`Snapshot as of ${dayjs(selectedMonth, 'YYYY-MM').format('MMMM YYYY')}`}
          delta={{ value: `${formatNumber(snapshots.length)} stored snapshots`, positive: true }}
        />
        <StatCard
          label="Monthly net"
          value={formatCurrency(cashFlowCurrent.net, 'en-BD', DEFAULT_CURRENCY)}
          description={`${formatCurrency(cashFlowCurrent.income, 'en-BD', DEFAULT_CURRENCY)} income vs ${formatCurrency(cashFlowCurrent.expense, 'en-BD', DEFAULT_CURRENCY)} expense`}
          delta={{ value: cashFlowCurrent.net >= 0 ? 'Positive' : 'Negative', positive: cashFlowCurrent.net >= 0 }}
        />
        <StatCard
          label="Total expenses (range)"
          value={formatCurrency(totalExpenseRange, 'en-BD', DEFAULT_CURRENCY)}
          description={`Based on ${transactions.length} transactions recorded locally.`}
          delta={{ value: `${formatNumber(budgets.length)} budgets tracked`, positive: true }}
        />
      </div>

      <Tabs defaultValue="net-worth" className="space-y-6">
        <TabsList className="bg-muted/20">
          <TabsTrigger value="net-worth">Net worth</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash flow</TabsTrigger>
          <TabsTrigger value="categories">Top categories</TabsTrigger>
          <TabsTrigger value="burn">Budget burn</TabsTrigger>
        </TabsList>
        <TabsContent value="net-worth" className="space-y-4">
          <ChartCard
            title="Net worth trend"
            description={`Rolling ${monthsRange}-month window ending ${months[months.length - 1]?.format('MMMM YYYY')}`}
          >
            <EChart option={netWorthOption} aria-label="Net worth trend" />
          </ChartCard>
        </TabsContent>
        <TabsContent value="cash-flow" className="space-y-4">
          <ChartCard
            title="Income vs expense"
            description={`Month-by-month breakdown over the last ${monthsRange} months.`}
          >
            <EChart option={cashFlowOption} aria-label="Cash flow chart" />
          </ChartCard>
        </TabsContent>
        <TabsContent value="categories" className="space-y-4">
          <ChartCard
            title="Top expense categories"
            description="Highest spend areas within the selected range."
          >
            <EChart option={categoriesOption} aria-label="Top categories chart" />
          </ChartCard>
        </TabsContent>
        <TabsContent value="burn" className="space-y-4">
          <ChartCard title="Budget burn" description="Compare allocation vs actual spend for this month.">
            <EChart option={budgetBurnOption} aria-label="Budget burn chart" />
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
