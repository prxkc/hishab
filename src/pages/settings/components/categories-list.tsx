import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'

export function CategoriesList() {
  const categories = useAppStore((state) => state.categories)

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No categories yet. Add income and expense buckets to organise your data.
      </p>
    )
  }

  const getParentName = (parentId: string | null | undefined) =>
    categories.find((category) => category.id === parentId)?.name ?? '—'

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {categories.map((category) => (
        <Card key={category.id} className="border border-border/30 bg-card/80 backdrop-blur">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-foreground">{category.name}</p>
              {category.parentId ? (
                <p className="text-xs text-muted-foreground">
                  Child of {getParentName(category.parentId)}
                </p>
              ) : null}
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary">
              {category.type === 'income' ? 'Income' : 'Expense'}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
