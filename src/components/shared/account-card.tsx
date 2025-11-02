import { motion } from 'framer-motion'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AccountCardProps {
  accountName: string
  accountNumber: string
  balance: string
  accountType?: string
  className?: string
  income?: string
  expense?: string
}

export function AccountCard({
  accountName: _accountName,
  accountNumber,
  balance,
  accountType = 'Direct Debits',
  className,
  income,
  expense,
}: AccountCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(className)}
    >
      <Card className="rounded-2xl border-0 bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                <span className="text-lg font-bold">V</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">VISA</p>
                <p className="text-xs text-muted-foreground">{accountType}</p>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="5" r="1.5" fill="currentColor" />
                <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                <circle cx="10" cy="15" r="1.5" fill="currentColor" />
              </svg>
            </button>
          </div>

          {/* Account Details */}
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Linked to main account</p>
            <p className="font-mono text-sm">**** {accountNumber.slice(-4)}</p>
          </div>

          {/* Balance Section */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Total income</p>
              <p className="text-xl font-bold text-foreground">{income || balance}</p>
            </div>
            <div className="flex gap-4">
              <button className="flex h-10 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90">
                Receive
              </button>
              <button className="flex h-10 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                Send
              </button>
            </div>
          </div>

          {/* Monthly Fee */}
          {expense && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Monthly regular fee</p>
                <p className="text-base font-semibold text-foreground">{expense}</p>
              </div>
              <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                <span>Edit</span>
                <span className="text-xs">cards limitation</span>
              </button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
