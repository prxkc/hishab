import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    props?: ButtonProps
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/40 bg-muted/10 px-6 py-12 text-center text-muted-foreground',
        className,
      )}
    >
      {icon ? <div className="text-primary">{icon}</div> : null}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? <p className="text-xs text-muted-foreground/80">{description}</p> : null}
      </div>
      {action ? (
        <Button size="sm" onClick={action.onClick} {...action.props}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
