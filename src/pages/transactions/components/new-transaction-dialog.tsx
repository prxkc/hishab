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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import { formatCurrency } from '@/lib/utils'
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
    charge: z.coerce
      .number({ invalid_type_error: 'Charge must be a number' })
      .min(0, 'Charge cannot be negative')
      .optional(),
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

export function NewTransactionDialog({
  triggerLabel = 'New Transaction',
}: NewTransactionDialogProps) {
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
      charge: 0,
    },
  })

  const transactionType = form.watch('type')
  const accountId = form.watch('accountId')
  const counterpartyAccountId = form.watch('counterpartyAccountId')

  const filteredCategories = useMemo(() => {
    if (transactionType === 'transfer') {
      return []
    }
    return categories.filter(
      (category) => category.type === (transactionType === 'income' ? 'income' : 'expense'),
    )
  }, [categories, transactionType])

  const sourceAccount = useMemo(
    () => accounts.find((account) => account.id === accountId),
    [accounts, accountId],
  )

  const destinationAccount = useMemo(
    () => accounts.find((account) => account.id === counterpartyAccountId),
    [accounts, counterpartyAccountId],
  )

  const shouldShowChargeField = useMemo(() => {
    if (transactionType !== 'transfer' || !sourceAccount || !destinationAccount) {
      return false
    }
    const isBkashSource = sourceAccount.name.toLowerCase().includes('bkash')
    const isCashDestination = destinationAccount.type === 'cash'

    return isBkashSource && isCashDestination
  }, [transactionType, sourceAccount, destinationAccount])

  const chargeCategory = useMemo(() => {
    const expenseCategories = categories.filter((category) => category.type === 'expense')
    const strictMatch = expenseCategories.find((category) => /\bcharge(s)?\b/i.test(category.name))
    if (strictMatch) {
      return strictMatch
    }
    return (
      expenseCategories.find((category) => category.id.toLowerCase().includes('charge')) ?? null
    )
  }, [categories])

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
        charge: 0,
      })
    }
  }, [open, accounts, form, selectedMonth])

  const handleSubmit = async (values: TransactionFormValues) => {
    const chargeAmount =
      typeof values.charge === 'number' && Number.isFinite(values.charge) ? values.charge : 0
    const submittedSourceAccount =
      accounts.find((account) => account.id === values.accountId) ?? null
    const submittedDestinationAccount =
      accounts.find((account) => account.id === values.counterpartyAccountId) ?? null
    const isCashoutTransfer =
      values.type === 'transfer' &&
      submittedSourceAccount !== null &&
      submittedDestinationAccount !== null &&
      submittedSourceAccount.name.toLowerCase().includes('bkash') &&
      submittedDestinationAccount.type === 'cash'
    const shouldCreateCharge = isCashoutTransfer && chargeAmount > 0

    if (shouldCreateCharge && !chargeCategory) {
      toast({
        title: 'Charge category not found',
        description: 'Create a charge category before recording cashout fees.',
        variant: 'destructive',
      })
      return
    }

    const { charge: _ignoredCharge, ...baseValues } = values

    try {
      await addTransaction({
        ...baseValues,
        counterpartyAccountId:
          baseValues.type === 'transfer' ? (baseValues.counterpartyAccountId ?? null) : null,
        categoryId: baseValues.type === 'transfer' ? null : (baseValues.categoryId ?? null),
      })
      if (shouldCreateCharge && chargeCategory && submittedSourceAccount) {
        await addTransaction({
          date: baseValues.date,
          type: 'expense',
          amount: chargeAmount,
          accountId: submittedSourceAccount.id,
          counterpartyAccountId: null,
          categoryId: chargeCategory.id,
          notes: `${submittedSourceAccount.name} cashout charge`,
        })
      }
      setOpen(false)
      toast({
        title: 'Transaction saved',
        description: shouldCreateCharge
          ? `Transferred ${formatCurrency(baseValues.amount)} and recorded ${formatCurrency(chargeAmount)} cashout charge.`
          : `Added ${baseValues.type} of ${formatCurrency(baseValues.amount)}.`,
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
                    <FormLabel>Amount</FormLabel>
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
                <>
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
                  {shouldShowChargeField ? (
                    <FormField
                      control={form.control}
                      name="charge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Charge</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>
                            Deducted from {sourceAccount?.name ?? 'source account'} when cashing
                            out.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                </>
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
