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
import { ScrollArea } from '@/components/ui/scroll-area'

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
        'group flex flex-col rounded-xl border border-transparent px-3 py-3 transition-colors duration-200',
        'hover:border-primary/20 hover:bg-primary/5',
        isActive ? 'border-primary/40 bg-primary/10 text-primary' : 'text-muted-foreground',
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-black/40 transition-colors duration-200',
            isActive && 'border-primary/40 bg-primary/15 text-primary',
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium tracking-tight">{item.label}</span>
          <span className="text-xs text-muted-foreground">{item.description}</span>
        </div>
      </div>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-border/50 bg-black/50 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" strokeWidth={1.7} />
        </div>
        <div>
          <p className="text-base font-semibold tracking-tight">Hishab</p>
          <p className="text-xs text-muted-foreground">Offline Personal Finance</p>
        </div>
      </div>
      <ScrollArea className="flex-1 px-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t border-border/40 px-6 py-5 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Offline-first</p>
        <p>All data is stored locally in your browser.</p>
      </div>
    </aside>
  )
}
