import { Suspense } from 'react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartCardProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function ChartCard({ title, description, actions, children }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Card className="h-full border border-border/40 bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </CardHeader>
        <CardContent className="h-[320px]">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Preparing visualization…
              </div>
            }
          >
            {children}
          </Suspense>
        </CardContent>
      </Card>
    </motion.div>
  )
}
