import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app-store'

const categorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  type: z.enum(['expense', 'income'], { required_error: 'Select a type' }),
  parentId: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

export function NewCategoryForm() {
  const categories = useAppStore((state) => state.categories)
  const addCategory = useAppStore((state) => state.addCategory)
  const { toast } = useToast()

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
      parentId: undefined,
    },
  })

  const typeValue = form.watch('type')

  const parentOptions = categories.filter((category) => category.type === typeValue)

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      await addCategory({
        name: values.name,
        type: values.type,
        parentId: values.parentId || null,
      })
      toast({
        title: 'Category created',
        description: `${values.name} added to ${values.type} categories.`,
      })
      form.reset({ name: '', type: values.type, parentId: undefined })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to create category',
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
              <FormLabel>Category name</FormLabel>
              <FormControl>
                <Input placeholder="Utilities" {...field} />
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel>Parent category (optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {parentOptions.map((category) => (
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
        <div className="md:col-span-3">
          <Button type="submit" className="w-full md:w-auto">
            Save category
          </Button>
        </div>
      </form>
    </Form>
  )
}
