import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app-store'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { DEFAULT_CURRENCY } from '@/domain/constants'

interface EditBudgetsSheetProps {
  triggerLabel?: string
}

export function EditBudgetsSheet({ triggerLabel = 'Adjust Budgets' }: EditBudgetsSheetProps) {
  const [open, setOpen] = useState(false)
  const budgets = useAppStore((state) => state.budgets)
  const categories = useAppStore((state) => state.categories.filter((category) => category.type === 'expense'))
  const upsertBudgets = useAppStore((state) => state.upsertBudgets)
  const selectedMonth = useAppStore((state) => state.selectedMonth)
  const { toast } = useToast()

  const initialAllocations = useMemo(() => {
    const byCategory = budgets.reduce<Record<string, number>>((acc, budget) => {
      acc[budget.categoryId] = budget.amount
      return acc
    }, {})
    categories.forEach((category) => {
      if (byCategory[category.id] === undefined) {
        byCategory[category.id] = 0
      }
    })
    return byCategory
  }, [budgets, categories])

  const [allocations, setAllocations] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      const formatted = Object.entries(initialAllocations).reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = value ? value.toString() : ''
        return acc
      }, {})
      setAllocations(formatted)
    }
  }, [initialAllocations, open])

  const total = useMemo(
    () =>
      Object.entries(allocations).reduce((sum, [, value]) => {
        const numeric = Number(value)
        return sum + (Number.isNaN(numeric) ? 0 : numeric)
      }, 0),
    [allocations],
  )

  const handleChange = (categoryId: string, value: string) => {
    if (/^\d*(\.\d{0,2})?$/.test(value)) {
      setAllocations((prev) => ({
        ...prev,
        [categoryId]: value,
      }))
    }
  }

  const handleSubmit = async () => {
    const updates = Object.entries(allocations).map(([categoryId, value]) => ({
      categoryId,
      amount: Number(value) || 0,
    }))

    try {
      await upsertBudgets(updates)
      setOpen(false)
      toast({
        title: 'Budgets updated',
        description: `Allocated ${formatCurrency(total, 'en-BD', DEFAULT_CURRENCY)} for ${formatNumber(
          categories.length,
        )} categories in ${selectedMonth}.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to update budgets',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>{triggerLabel}</Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-6 border-border/40 bg-background/95 sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle>Adjust monthly budgets</SheetTitle>
          <SheetDescription>
            Tune your category envelopes. Changes only apply to the selected month.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                className="space-y-2 rounded-lg border border-border/20 bg-muted/10 p-4"
              >
                <div className="flex items-center justify-between text-sm font-medium text-foreground">
                  <span>{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Current: {formatCurrency(initialAllocations[category.id] ?? 0, 'en-BD', DEFAULT_CURRENCY)}
                  </span>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`budget-${category.id}`} className="text-xs uppercase text-muted-foreground">
                    Amount ({DEFAULT_CURRENCY})
                  </Label>
                  <Input
                    id={`budget-${category.id}`}
                    inputMode="decimal"
                    value={allocations[category.id] ?? ''}
                    onChange={(event) => handleChange(category.id, event.target.value)}
                  />
                </div>
              </motion.div>
            ))}
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add expense categories in Settings to begin budgeting.</p>
            ) : null}
          </div>
        </ScrollArea>
        <SheetFooter className="flex flex-col gap-3 sm:flex-col">
          <div className="flex items-center justify-between rounded-lg border border-border/20 bg-muted/10 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total allocation</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(total, 'en-BD', DEFAULT_CURRENCY)}
            </span>
          </div>
          <Button onClick={handleSubmit} disabled={categories.length === 0}>
            Save budgets
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
