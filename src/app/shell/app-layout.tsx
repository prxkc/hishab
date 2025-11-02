import { useEffect } from 'react'

import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'

import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const initialize = useAppStore((state) => state.initialize)
  const isLoading = useAppStore((state) => state.isLoading)
  const loadError = useAppStore((state) => state.loadError)
  const refresh = useAppStore((state) => state.refresh)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col lg:ml-64">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="w-full px-8 py-8">
            {isLoading ? (
              <LoadingState />
            ) : loadError ? (
              <ErrorState message={loadError} onRetry={refresh} />
            ) : (
              children
            )}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
        <p className="text-sm">Preparing your local workspace…</p>
      </div>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => Promise<void> | void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <p className="text-lg font-semibold text-foreground">Unable to load data</p>
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
      <Button
        onClick={() => {
          void onRetry()
        }}
      >
        Try again
      </Button>
    </div>
  )
}
