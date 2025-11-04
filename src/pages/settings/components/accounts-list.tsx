import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
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
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/hooks/use-toast'

export function AccountsList() {
  const accounts = useAppStore((state) => state.accounts)
  const deleteAccount = useAppStore((state) => state.deleteAccount)
  const { toast } = useToast()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async (accountId: string) => {
    setIsDeleting(true)
    try {
      await deleteAccount(accountId)
      toast({
        title: 'Account deleted',
        description: 'It will no longer appear across balances or forms.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unable to delete account',
        description:
          error instanceof Error
            ? error.message
            : 'Ensure related transactions are removed, then try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setPendingDeleteId(null)
    }
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No accounts yet. Add one above to get started.
      </p>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {accounts.map((account) => (
        <Card key={account.id} className="rounded-2xl border-0 bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{account.name}</p>
                <p className="font-money text-3xl font-bold tracking-tight text-foreground">
                  {formatCurrency(account.balance)}
                </p>
              </div>
              <Dialog
                open={pendingDeleteId === account.id}
                onOpenChange={(open: boolean) => setPendingDeleteId(open ? account.id : null)}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${account.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete account?</DialogTitle>
                    <DialogDescription>
                      Removing {account.name} does not delete related transactions. Delete or
                      reassign them first to avoid orphan data.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" disabled={isDeleting}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={() => handleDeleteAccount(account.id)}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
