import { Link, useRouterState } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
  ChartNoAxesCombined,
  CreditCard,
  FolderKanban,
  Settings,
  Shield,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  description: string
}

const navItems: NavItem[] = [
  {
    label: 'Overview',
    to: '/',
    icon: ChartNoAxesCombined,
    description: 'Monthly summary & KPIs',
  },
  {
    label: 'Transactions',
    to: '/transactions',
    icon: Wallet,
    description: 'Capture income, expenses & transfers',
  },
  {
    label: 'Budgets',
    to: '/budgets',
    icon: FolderKanban,
    description: 'Plan and track spending envelopes',
  },
  {
    label: 'Goals',
    to: '/goals',
    icon: Sparkles,
    description: 'Savings targets & progress tracking',
  },
  {
    label: 'Reports',
    to: '/reports',
    icon: CreditCard,
    description: 'Trend analysis & charts',
  },
  {
    label: 'Data Studio',
    to: '/data',
    icon: Shield,
    description: 'Backup, import/export & encryption',
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
    description: 'Preferences, accounts & categories',
  },
]

function SidebarLink({ item }: { item: NavItem }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
  const Icon = item.icon

  return (
    <Link
      to={item.to}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
        'hover:bg-primary/5',
        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.8} />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed hidden h-screen w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
      {/* Logo Section */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight">Hishab</p>
          <p className="text-xs text-muted-foreground">Personal Finance</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4">
        <div className="text-xs text-muted-foreground">
          <p className="mb-1 text-sm font-medium text-foreground">Offline-first</p>
          <p>All data stored locally</p>
        </div>
      </div>
    </aside>
  )
}
