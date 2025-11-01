import { ArchiveRestore } from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app-store'
import { GoalsList } from './components/goals-list'
import { NewGoalDialog } from './components/new-goal-dialog'

export function GoalsPage() {
  const goals = useAppStore((state) => state.goals)
  const { toast } = useToast()

  const handleCelebrate = () => {
    toast({
      title: 'All achievements are local',
      description: 'Completed goals will appear here once you mark them done.',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Future You"
        title="Savings Goals"
        description="Set targets, monitor progress, and keep your motivation high with a minimal dark dashboard."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCelebrate} disabled={goals.length === 0}>
              <ArchiveRestore className="mr-2 h-4 w-4" />
              Completed
            </Button>
            <NewGoalDialog />
          </div>
        }
      />
      <GoalsList />
    </div>
  )
}
