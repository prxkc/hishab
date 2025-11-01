import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { DEFAULT_CURRENCY } from '@/domain/constants'
import { useAppStore } from '@/store/app-store'
import { formatCurrency } from '@/lib/utils'

const goalSchema = z.object({
  name: z.string().min(2, 'Goal name is required'),
  targetAmount: z.coerce
    .number({ invalid_type_error: 'Target amount must be a number' })
    .positive('Target amount must be greater than zero'),
  targetDate: z.string().optional(),
})

type GoalFormValues = z.infer<typeof goalSchema>

interface NewGoalDialogProps {
  triggerLabel?: string
}

export function NewGoalDialog({ triggerLabel = 'New Goal' }: NewGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const addGoal = useAppStore((state) => state.addGoal)
  const { toast } = useToast()

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      targetDate: undefined,
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({ name: '', targetAmount: 0, targetDate: undefined })
    }
  }, [form, open])

  const handleSubmit = async (values: GoalFormValues) => {
    try {
      const goal = await addGoal({
        name: values.name,
        targetAmount: values.targetAmount,
        targetDate: values.targetDate,
      })
      setOpen(false)
      toast({
        title: 'Goal created',
        description: `Targeting ${formatCurrency(goal.targetAmount, 'en-BD', DEFAULT_CURRENCY)}.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to create goal',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border border-border/40 bg-card/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle>Create savings goal</DialogTitle>
          <DialogDescription>Stay accountable with clear targets and due dates.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal name</FormLabel>
                  <FormControl>
                    <Input placeholder="Emergency fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target amount ({DEFAULT_CURRENCY})</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="min-w-[120px]">
                Save goal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
