import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
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
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/hooks/use-toast'

export function GoalsList() {
  const goals = useAppStore((state) => state.goals)
  const updateGoal = useAppStore((state) => state.updateGoal)
  const deleteGoal = useAppStore((state) => state.deleteGoal)
  const { toast } = useToast()
  const [allocations, setAllocations] = useState<Record<string, string>>({})
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const next = goals.reduce<Record<string, string>>((acc, goal) => {
      acc[goal.id] = goal.currentAllocated ? goal.currentAllocated.toString() : ''
      return acc
    }, {})
    setAllocations(next)
  }, [goals])

  const summary = useMemo(() => {
    if (goals.length === 0) {
      return { completion: 0, target: 0, allocated: 0 }
    }
    const target = goals.reduce((total, goal) => total + goal.targetAmount, 0)
    const allocated = goals.reduce((total, goal) => total + goal.currentAllocated, 0)
    return {
      completion: target > 0 ? (allocated / target) * 100 : 0,
      target,
      allocated,
    }
  }, [goals])

  const handleBlur = async (goalId: string) => {
    const value = allocations[goalId]
    const numeric = Number(value)
    if (Number.isNaN(numeric)) {
      return
    }
    try {
      await updateGoal({ id: goalId, currentAllocated: numeric })
      toast({
        title: 'Goal updated',
        description: `Allocated ${formatCurrency(numeric)} so far.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to update goal',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    setIsDeleting(true)
    try {
      await deleteGoal(goalId)
      toast({
        title: 'Goal deleted',
        description: 'Removed from your savings list.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to delete goal',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setPendingDeleteId(null)
    }
  }

  if (goals.length === 0) {
    return (
      <EmptyState
        title="No goals yet"
        description="Create a savings goal to see progress tracking here."
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border/30 bg-card/80 backdrop-blur">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Portfolio progress</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.allocated)} saved of {formatCurrency(summary.target)} target.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={summary.completion} className="h-2 w-40 bg-primary/10" />
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {Math.round(summary.completion)}% complete
            </Badge>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal, index) => {
          const completion =
            goal.targetAmount > 0 ? (goal.currentAllocated / goal.targetAmount) * 100 : 0
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
            >
              <Card className="h-full border border-border/30 bg-card/80 backdrop-blur">
                <CardContent className="flex h-full flex-col gap-4 py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">{goal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Target: {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {goal.targetDate ? (
                        <Badge variant="outline" className="border-primary/40 text-primary">
                          Due {dayjs(goal.targetDate).format('MMM D, YYYY')}
                        </Badge>
                      ) : null}
                      <Dialog
                        open={pendingDeleteId === goal.id}
                        onOpenChange={(open: boolean) => setPendingDeleteId(open ? goal.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Delete ${goal.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete goal?</DialogTitle>
                            <DialogDescription>
                              {goal.name} will be removed permanently, including its progress
                              history.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline" disabled={isDeleting}>
                                Cancel
                              </Button>
                            </DialogClose>
                            <Button
                              onClick={() => handleDeleteGoal(goal.id)}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Progress value={Math.min(100, completion)} className="h-2 bg-primary/10" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{Math.round(completion)}% funded</span>
                      <span>
                        {formatCurrency(goal.currentAllocated)} /{' '}
                        {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor={`allocation-${goal.id}`}
                      className="text-xs uppercase text-muted-foreground"
                    >
                      Allocated so far
                    </label>
                    <Input
                      id={`allocation-${goal.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={allocations[goal.id] ?? ''}
                      onChange={(event) =>
                        setAllocations((prev) => ({
                          ...prev,
                          [goal.id]: event.target.value,
                        }))
                      }
                      onBlur={() => handleBlur(goal.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
