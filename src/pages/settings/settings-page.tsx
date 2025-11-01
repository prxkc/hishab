import { useEffect, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

import { AccountsList } from './components/accounts-list'
import { CategoriesList } from './components/categories-list'
import { NewAccountForm } from './components/new-account-form'
import { NewCategoryForm } from './components/new-category-form'

interface PreferencesState {
  currency: string
  locale: string
  timezone: string
}

const PREFERENCES_KEY = 'hishab:preferences'

export function SettingsPage() {
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<PreferencesState>({
    currency: 'BDT',
    locale: 'en-BD',
    timezone: 'Asia/Dhaka',
  })

  useEffect(() => {
    const stored = window.localStorage.getItem(PREFERENCES_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PreferencesState
        setPreferences(parsed)
      } catch (error) {
        console.error('Failed to parse preferences', error)
      }
    }
  }, [])

  const handleSavePreferences = () => {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
    toast({
      title: 'Preferences saved',
      description: 'Your defaults are stored locally and applied across the app.',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control Center"
        title="Settings"
        description="Manage preferences, accounts, categories, and explore upcoming experimental features."
      />
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="w-full justify-start gap-2 bg-muted/40">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="labs">Labs</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card className="border border-border/40 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Preferences</CardTitle>
              <CardDescription>
                These defaults apply to currency formatting, locale, and timezone within Hishab.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="pref-currency">Currency</Label>
                <Input
                  id="pref-currency"
                  value={preferences.currency}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pref-locale">Locale</Label>
                <Input
                  id="pref-locale"
                  value={preferences.locale}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, locale: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pref-timezone">Timezone</Label>
                <Input
                  id="pref-timezone"
                  value={preferences.timezone}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, timezone: event.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Button onClick={handleSavePreferences}>Save preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="accounts" className="space-y-4">
          <Card className="border border-border/40 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Add account</CardTitle>
              <CardDescription>Bank, wallet, or cash balances. Stored securely in IndexedDB.</CardDescription>
            </CardHeader>
            <CardContent>
              <NewAccountForm />
            </CardContent>
          </Card>
          <AccountsList />
        </TabsContent>
        <TabsContent value="categories" className="space-y-4">
          <Card className="border border-border/40 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Add category</CardTitle>
              <CardDescription>Define income and expense buckets to power budgets and reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <NewCategoryForm />
            </CardContent>
          </Card>
          <CategoriesList />
        </TabsContent>
        <TabsContent value="labs">
          <Card className="border border-dashed border-border/40 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Labs</CardTitle>
              <CardDescription>Sneak peek at experiments and upcoming modules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Planned:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Encryption wizard with password strength audit.</li>
                <li>Rule-based auto categorisation using on-device AI.</li>
                <li>Net worth projections with scenario modelling.</li>
              </ul>
              <p className="text-xs text-muted-foreground/80">Toggle switches will appear here once features are ready.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
