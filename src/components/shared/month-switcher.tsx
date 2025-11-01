import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { selectSelectedMonth } from '@/store/selectors'

export function MonthSwitcher() {
  const selectedMonth = useAppStore(selectSelectedMonth)
  const setSelectedMonth = useAppStore((state) => state.setSelectedMonth)

  const current = dayjs(selectedMonth, 'YYYY-MM')
  const now = dayjs()
  const isCurrentMonth = current.isSame(now, 'month')

  const goToPrevious = () => {
    setSelectedMonth(current.subtract(1, 'month').format('YYYY-MM'))
  }

  const goToNext = () => {
    if (isCurrentMonth) {
      return
    }
    setSelectedMonth(current.add(1, 'month').format('YYYY-MM'))
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/20 px-2 py-1 text-sm">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[120px] text-center text-sm font-medium">
        {current.format('MMMM YYYY')}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={goToNext}
        disabled={isCurrentMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
