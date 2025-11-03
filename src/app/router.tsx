import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

import { AppLayout } from './shell/app-layout'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { AccountsPage } from '@/pages/accounts/accounts-page'
import { TransactionsPage } from '@/pages/transactions/transactions-page'
import { BudgetsPage } from '@/pages/budgets/budgets-page'
import { ReportsPage } from '@/pages/reports/reports-page'
import { GoalsPage } from '@/pages/goals/goals-page'
import { DataPage } from '@/pages/data/data-page'
import { SettingsPage } from '@/pages/settings/settings-page'

const RootComponent = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
)

const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-muted-foreground">
        The page you were looking for does not exist or has been moved. Please check the navigation.
      </p>
    </div>
  ),
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounts',
  component: AccountsPage,
})

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions',
  component: TransactionsPage,
})

const budgetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/budgets',
  component: BudgetsPage,
})

const goalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/goals',
  component: GoalsPage,
})

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
})

const dataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data',
  component: DataPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  accountsRoute,
  transactionsRoute,
  budgetsRoute,
  goalsRoute,
  reportsRoute,
  dataRoute,
  settingsRoute,
])

export const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
