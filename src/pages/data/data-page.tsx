import { useRef, useState } from 'react'
import dayjs from 'dayjs'
import { Database, ShieldCheck } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { exportToJson, importFromJson } from '@/data/services/data-service'
import type { BackupPayload } from '@/domain/types'
import { useAppStore } from '@/store/app-store'

export function DataPage() {
  const [encryptionEnabled, setEncryptionEnabled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const refresh = useAppStore((state) => state.refresh)
  const accounts = useAppStore((state) => state.accounts)
  const transactions = useAppStore((state) => state.transactions)
  const budgets = useAppStore((state) => state.budgets)
  const goals = useAppStore((state) => state.goals)

  const handleExport = async () => {
    try {
      const payload = await exportToJson()
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `hishab-backup-${dayjs().format('YYYYMMDD-HHmmss')}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      toast({
        title: 'Backup generated',
        description: 'JSON export saved via your browser downloads.',
      })
    } catch (error: unknown) {
      console.error(error)
      toast({
        title: 'Export failed',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    try {
      const text = await file.text()
      const json = JSON.parse(text) as BackupPayload
      await importFromJson(json)
      await refresh()
      toast({
        title: 'Backup restored',
        description: `${file.name} imported successfully.`,
      })
    } catch (error: unknown) {
      console.error(error)
      toast({
        title: 'Import failed',
        description: 'Ensure the file is a valid Hishab backup.',
        variant: 'destructive',
      })
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data Studio"
        title="Backup & Security"
        description="Export or restore your local data, keep an eye on usage, and preview upcoming encryption controls."
      />

      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />

      <Card className="border border-border/40 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Backups</CardTitle>
          <CardDescription>
            Generate a JSON snapshot of everything or restore from a previous export.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <Button onClick={handleExport}>Export JSON</Button>
            <Button variant="outline" onClick={handleImportClick}>
              Import JSON
            </Button>
          </div>
          <Separator orientation="vertical" className="hidden h-24 md:block" />
          <div className="flex-1 space-y-3 rounded-lg border border-dashed border-border/30 bg-muted/10 p-4 text-sm text-muted-foreground">
            <p>
              Encrypted exports remain on-device. Files never leave your browser unless you manually move
              them.
            </p>
            <p className="text-xs text-muted-foreground/80">
              Tip: schedule periodic exports to your personal drive for redundancy.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/40 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">IndexedDB inventory</CardTitle>
          <CardDescription>Quick view of how much data lives locally.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <UsageCell icon={<Database className="h-5 w-5" />} label="Accounts" value={accounts.length} />
          <UsageCell icon={<Database className="h-5 w-5" />} label="Transactions" value={transactions.length} />
          <UsageCell icon={<Database className="h-5 w-5" />} label="Budgets" value={budgets.length} />
          <UsageCell icon={<Database className="h-5 w-5" />} label="Goals" value={goals.length} />
          {transactions.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={<ShieldCheck className="h-6 w-6" />}
                title="No entries yet"
                description="Start logging transactions to populate these metrics."
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-border/40 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Encryption at rest</CardTitle>
          <CardDescription>
            Planned support for password-based AES-GCM encryption using WebCrypto APIs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Enable encryption (coming soon)</p>
              <p className="text-xs text-muted-foreground">
                Design is ready. Implementation will land in the security milestone.
              </p>
            </div>
            <Switch checked={encryptionEnabled} onCheckedChange={setEncryptionEnabled} disabled />
          </div>
          <Progress value={encryptionEnabled ? 100 : 40} className="h-2 bg-primary/10" />
        </CardContent>
      </Card>
    </div>
  )
}

interface UsageCellProps {
  icon: React.ReactNode
  label: string
  value: number
}

function UsageCell({ icon, label, value }: UsageCellProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/20 bg-muted/10 px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{value} records</p>
      </div>
    </div>
  )
}
