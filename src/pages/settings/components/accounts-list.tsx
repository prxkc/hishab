import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DEFAULT_CURRENCY } from '@/domain/constants'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

const typeLabels: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  wallet: 'Wallet',
}

export function AccountsList() {
  const accounts = useAppStore((state) => state.accounts)

  if (accounts.length === 0) {
    return <p className="text-sm text-muted-foreground">No accounts yet. Add one above to get started.</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {accounts.map((account) => (
        <Card key={account.id} className="border border-border/30 bg-card/80 backdrop-blur">
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{account.name}</p>
                <p className="text-xs text-muted-foreground">
                  Balance {formatCurrency(account.balance, 'en-BD', account.currency ?? DEFAULT_CURRENCY)}
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {typeLabels[account.type] ?? account.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Created {new Date(account.createdAt).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
