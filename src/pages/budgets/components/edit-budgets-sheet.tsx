import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app-store'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface EditBudgetsSheetProps {
  triggerLabel?: string
}

export function EditBudgetsSheet({ triggerLabel = 'Adjust Budgets' }: EditBudgetsSheetProps) {
  const [open, setOpen] = useState(false)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const budgets = useAppStore((state) => state.budgets)
  const categories = useAppStore((state) =>
    state.categories.filter((category) => category.type === 'expense'),
  )
  const upsertBudgets = useAppStore((state) => state.upsertBudgets)
  const addCategory = useAppStore((state) => state.addCategory)
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
      const formatted = Object.entries(initialAllocations).reduce<Record<string, string>>(
        (acc, [key, value]) => {
          acc[key] = value !== undefined && value !== null ? value.toString() : '0'
          return acc
        },
        {},
      )
      setAllocations(formatted)
    }
    // Only initialize when sheet opens, not when initialAllocations changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const total = useMemo(
    () =>
      Object.entries(allocations).reduce((sum, [, value]) => {
        const numeric = Number(value)
        return sum + (Number.isNaN(numeric) ? 0 : numeric)
      }, 0),
    [allocations],
  )

  const handleChange = (categoryId: string, value: string) => {
    // Allow empty string, digits, and decimal numbers with up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAllocations((prev) => ({
        ...prev,
        [categoryId]: value,
      }))
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Category name required',
        description: 'Please enter a name for the category.',
        variant: 'destructive',
      })
      return
    }

    setIsCreatingCategory(true)
    try {
      await addCategory({
        name: newCategoryName.trim(),
        type: 'expense',
        parentId: null,
      })
      toast({
        title: 'Category created',
        description: `${newCategoryName} added to expense categories.`,
      })
      setNewCategoryName('')
      setIsAddCategoryOpen(false)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to create category',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingCategory(false)
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
        description: `Allocated ${formatCurrency(total)} for ${formatNumber(categories.length)} categories in ${selectedMonth}.`,
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
                    Current:{' '}
                    <span className="font-money">
                      {formatCurrency(initialAllocations[category.id] ?? 0)}
                    </span>
                  </span>
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor={`budget-${category.id}`}
                    className="text-xs uppercase text-muted-foreground"
                  >
                    Amount
                  </Label>
                  <Input
                    id={`budget-${category.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={allocations[category.id] ?? '0'}
                    onChange={(event) => handleChange(category.id, event.target.value)}
                  />
                </div>
              </motion.div>
            ))}
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add expense categories in Settings to begin budgeting.
              </p>
            ) : null}

            {/* Add New Category Button */}
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-4 w-full gap-2" size="sm">
                  <Plus className="h-4 w-4" />
                  Add New Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Budget Category</DialogTitle>
                  <DialogDescription>
                    Add a new expense category to track and budget for.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      placeholder="e.g., Groceries, Transportation"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          void handleCreateCategory()
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddCategoryOpen(false)}
                    disabled={isCreatingCategory}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={isCreatingCategory}>
                    {isCreatingCategory ? 'Creating...' : 'Create Category'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </ScrollArea>
        <SheetFooter className="flex flex-col gap-3 sm:flex-col">
          <div className="flex items-center justify-between rounded-lg border border-border/20 bg-muted/10 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total allocation</span>
            <span className="font-money font-semibold text-foreground">
              {formatCurrency(total)}
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
