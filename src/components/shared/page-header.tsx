import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  className?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, eyebrow, className, actions }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 md:flex-row md:items-center md:justify-between', className)}>
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.25em] text-primary/70">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
