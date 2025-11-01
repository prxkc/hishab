import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { DEFAULT_CURRENCY } from '@/domain/constants'
import { useAppStore } from '@/store/app-store'

const transactionSchema = z
  .object({
    date: z.string().min(1, 'Date is required'),
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.coerce
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be greater than zero'),
    accountId: z.string().min(1, 'Account is required'),
    counterpartyAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    notes: z.string().max(240).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'transfer') {
      if (!data.counterpartyAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['counterpartyAccountId'],
          message: 'Select the destination account',
        })
      }
      if (data.counterpartyAccountId === data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['counterpartyAccountId'],
          message: 'Destination must differ from source',
        })
      }
    } else if (!data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoryId'],
        message: 'Select a category',
      })
    }
  })

type TransactionFormValues = z.infer<typeof transactionSchema>

interface NewTransactionDialogProps {
  triggerLabel?: string
}

export function NewTransactionDialog({ triggerLabel = 'New Transaction' }: NewTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const accounts = useAppStore((state) => state.accounts)
  const categories = useAppStore((state) => state.categories)
  const addTransaction = useAppStore((state) => state.addTransaction)
  const selectedMonth = useAppStore((state) => state.selectedMonth)
  const { toast } = useToast()

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: dayjs().format('YYYY-MM-DD'),
      type: 'expense',
      amount: 0,
      accountId: accounts[0]?.id ?? '',
      counterpartyAccountId: undefined,
      categoryId: undefined,
      notes: '',
    },
  })

  const transactionType = form.watch('type')

  const filteredCategories = useMemo(() => {
    if (transactionType === 'transfer') {
      return []
    }
    return categories.filter((category) => category.type === (transactionType === 'income' ? 'income' : 'expense'))
  }, [categories, transactionType])

  useEffect(() => {
    if (transactionType === 'transfer') {
      form.setValue('categoryId', undefined)
    }
  }, [transactionType, form])

  useEffect(() => {
    if (!open) {
      form.reset({
        date: dayjs(selectedMonth, 'YYYY-MM').endOf('month').isBefore(dayjs())
          ? dayjs(selectedMonth, 'YYYY-MM').endOf('month').format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
        type: 'expense',
        amount: 0,
        accountId: accounts[0]?.id ?? '',
        counterpartyAccountId: undefined,
        categoryId: undefined,
        notes: '',
      })
    }
  }, [open, accounts, form, selectedMonth])

  const handleSubmit = async (values: TransactionFormValues) => {
    try {
      await addTransaction({
        ...values,
        counterpartyAccountId: values.type === 'transfer' ? values.counterpartyAccountId ?? null : null,
        categoryId: values.type === 'transfer' ? null : values.categoryId ?? null,
      })
      setOpen(false)
      toast({
        title: 'Transaction saved',
        description: `Added ${values.type} of ${values.amount.toLocaleString('en-BD', {
          style: 'currency',
          currency: DEFAULT_CURRENCY,
        })}.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to save transaction',
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
      <DialogContent className="max-w-lg border border-border/40 bg-card/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle>Record a transaction</DialogTitle>
          <DialogDescription>Your ledger never leaves this device.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} max={dayjs().format('YYYY-MM-DD')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ({DEFAULT_CURRENCY})</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {transactionType === 'transfer' ? (
                <FormField
                  control={form.control}
                  name="counterpartyAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts
                            .filter((account) => account.id !== form.getValues('accountId'))
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Optional memo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button type="submit" className="min-w-[120px]">
                Save transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
