import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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

const typeLabels: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  wallet: 'Wallet',
}

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
        <Card key={account.id} className="border border-border/30 bg-card/80 backdrop-blur">
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{account.name}</p>
                <p className="text-xs text-muted-foreground">
                  Balance {formatCurrency(account.balance)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {typeLabels[account.type] ?? account.type}
                </Badge>
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
            </div>
            <p className="text-xs text-muted-foreground">
              Created{' '}
              {new Date(account.createdAt).toLocaleDateString('en-BD', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
