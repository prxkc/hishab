import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { CircleAlert, Signal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function Topbar() {
  const headerRef = useRef<HTMLElement | null>(null)
  const badgeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
        )
      }
      if (badgeRef.current) {
        gsap.fromTo(
          badgeRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)', delay: 0.2 },
        )
      }
    })

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-6"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="search"
            placeholder="Search"
            className="h-9 w-64 rounded-lg border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <CircleAlert className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={badgeRef}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
              >
                <Signal className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <p>All data stored locally on your device</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
