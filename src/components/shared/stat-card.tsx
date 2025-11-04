import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  description?: string
  delta?: {
    value: string
    positive?: boolean
  }
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, description, delta, icon, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(className)}
    >
      <Card className="group rounded-2xl border-0 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-6">
          <div className="flex-1">
            <CardDescription className="mb-2 text-sm font-medium text-muted-foreground">
              {label}
            </CardDescription>
            <CardTitle className="font-money text-3xl font-bold tracking-tight text-foreground">
              {value}
            </CardTitle>
          </div>
          {icon ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
              {icon}
            </div>
          ) : null}
        </CardHeader>
        {description || delta ? (
          <CardContent className="space-y-2 pb-6">
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            {delta ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-money text-sm font-medium',
                  delta.positive ? 'text-success' : 'text-destructive',
                )}
              >
                {delta.positive ? '↑' : '↓'} {delta.value}
              </span>
            ) : null}
          </CardContent>
        ) : null}
      </Card>
    </motion.div>
  )
}
