import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
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
import { useToast } from '@/hooks/use-toast'
import { DEFAULT_CURRENCY } from '@/domain/constants'
import { useAppStore } from '@/store/app-store'

const accountSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  type: z.enum(['cash', 'bank', 'wallet'], { required_error: 'Select an account type' }),
  balance: z.coerce
    .number({ invalid_type_error: 'Balance must be a number' })
    .min(0, 'Balance cannot be negative'),
})

type AccountFormValues = z.infer<typeof accountSchema>

interface NewAccountFormProps {
  onSuccess?: () => void
  submitLabel?: string
}

export function NewAccountForm({
  onSuccess,
  submitLabel = 'Save account',
}: NewAccountFormProps = {}) {
  const addAccount = useAppStore((state) => state.addAccount)
  const { toast } = useToast()
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'cash',
      balance: 0,
    },
  })

  const onSubmit = async (values: AccountFormValues) => {
    try {
      await addAccount({
        name: values.name,
        type: values.type,
        balance: values.balance,
        currency: DEFAULT_CURRENCY,
      })
      toast({
        title: 'Account created',
        description: `${values.name} is ready for transactions.`,
      })
      form.reset({ name: '', type: 'cash', balance: 0 })
      onSuccess?.()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to create account',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-4 md:grid-cols-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Account name</FormLabel>
              <FormControl>
                <Input placeholder="City Bank" {...field} />
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
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening balance</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="md:col-span-3">
          <Button type="submit" className="w-full md:w-auto">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
