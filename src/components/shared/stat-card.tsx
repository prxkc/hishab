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
      <Card className="group border border-border/40 bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground/80">
              {label}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold text-foreground">{value}</CardTitle>
          </div>
          {icon ? <div className="text-primary group-hover:scale-105 transition-transform duration-300">{icon}</div> : null}
        </CardHeader>
        {description || delta ? (
          <CardContent className="space-y-2 pt-4 text-sm text-muted-foreground">
            {description ? <p>{description}</p> : null}
            {delta ? (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                  delta.positive
                    ? 'bg-success/15 text-success'
                    : 'bg-destructive/20 text-destructive-foreground',
                )}
              >
                {delta.value}
              </span>
            ) : null}
          </CardContent>
        ) : null}
      </Card>
    </motion.div>
  )
}
