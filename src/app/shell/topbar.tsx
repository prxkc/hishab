import { useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import gsap from 'gsap'
import { Link } from '@tanstack/react-router'
import { CircleAlert, Plus, Signal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ThemeToggle } from './theme-toggle'

export function Topbar() {
  const today = dayjs().format('dddd, D MMM YYYY')
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
      className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur"
    >
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary/70">Today</p>
          <p className="text-sm font-medium text-muted-foreground">{today}</p>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={badgeRef}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                <Signal className="h-3.5 w-3.5" />
                <span>Offline-Ready</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <p>Hishab runs entirely in your browser. No data leaves your device.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <CircleAlert className="h-5 w-5" />
        </Button>
        <Button size="sm" className="gap-2" variant="default" asChild>
          <Link to="/transactions">
            <Plus className="h-4 w-4" />
            Ledger
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
