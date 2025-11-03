import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { AccountsList } from '@/pages/settings/components/accounts-list'
import { NewAccountForm } from '@/pages/settings/components/new-account-form'

export function AccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manage"
        title="Accounts"
        description="Add, view, and manage your bank accounts, wallets, and cash balances."
      />
      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Add account</CardTitle>
          <CardDescription>
            Bank, wallet, or cash balances. Stored securely in IndexedDB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewAccountForm />
        </CardContent>
      </Card>
      <AccountsList />
    </div>
  )
}
