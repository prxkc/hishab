import { useEffect, useRef } from 'react'
import type { ECharts, EChartsOption } from 'echarts'

import { cn } from '@/lib/utils'

export interface EChartProps {
  option: EChartsOption
  className?: string
  'aria-label'?: string
}

export function EChart({ option, className, 'aria-label': ariaLabel }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const themeMode =
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'

  useEffect(() => {
    let chart: ECharts | undefined
    let resizeHandler: (() => void) | undefined

    const initialize = async () => {
      const echarts = (await import('echarts')) as typeof import('echarts')
      if (!containerRef.current) {
        return
      }
      chart = echarts.init(containerRef.current, themeMode === 'dark' ? minimalDarkTheme : undefined, {
        renderer: 'canvas',
      })
      chart.setOption(option)
      resizeHandler = () => chart?.resize()
      window.addEventListener('resize', resizeHandler)
    }

    initialize().catch((error: unknown) => console.error('Failed to initialize chart', error))

    return () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
      }
      if (chart) {
        chart.dispose()
      }
    }
  }, [option, themeMode])

  return <div ref={containerRef} role="img" aria-label={ariaLabel} className={cn('h-full w-full', className)} />
}

// Minimal dark theme definition inspired by Apache ECharts examples.
const minimalDarkTheme = {
  color: ['#34d399', '#60a5fa', '#f472b6', '#f59e0b', '#818cf8'],
  backgroundColor: 'transparent',
  textStyle: {
    color: '#e2e8f0',
  },
  title: {
    textStyle: {
      color: '#f8fafc',
    },
    subtextStyle: {
      color: '#94a3b8',
    },
  },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 0,
    textStyle: {
      color: '#f8fafc',
    },
  },
  grid: {
    top: 32,
    left: 16,
    right: 16,
    bottom: 16,
    containLabel: true,
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#334155' } },
    splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
    axisLabel: { color: '#94a3b8' },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#334155' } },
    axisLabel: { color: '#94a3b8' },
    axisTick: { alignWithLabel: true },
  },
}
