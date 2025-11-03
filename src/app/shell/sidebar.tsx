import { Link, useRouterState } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
  Building2,
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
    label: 'Accounts',
    to: '/accounts',
    icon: Building2,
    description: 'Manage bank accounts & wallets',
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
    description: 'Preferences & categories',
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
      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  )
}
