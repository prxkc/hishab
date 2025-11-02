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
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'

  useEffect(() => {
    let chart: ECharts | undefined
    let resizeHandler: (() => void) | undefined

    const initialize = async () => {
      const echarts = (await import('echarts')) as typeof import('echarts')
      if (!containerRef.current) {
        return
      }
      chart = echarts.init(
        containerRef.current,
        themeMode === 'dark' ? minimalDarkTheme : minimalLightTheme,
        {
          renderer: 'canvas',
        },
      )
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

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className={cn('h-full w-full', className)}
    />
  )
}

// Minimal light theme with coral/orange accent
const minimalLightTheme = {
  color: ['#EA6A47', '#6b7280', '#34d399', '#f59e0b', '#a78bfa'],
  backgroundColor: 'transparent',
  textStyle: {
    color: '#1f1f1f',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  title: {
    textStyle: {
      color: '#1f1f1f',
    },
    subtextStyle: {
      color: '#737373',
    },
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    textStyle: {
      color: '#1f1f1f',
    },
    shadowBlur: 8,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
  },
  grid: {
    top: 32,
    left: 16,
    right: 16,
    bottom: 16,
    containLabel: true,
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#e5e5e5' } },
    splitLine: { lineStyle: { color: '#f5f5f5' } },
    axisLabel: { color: '#737373' },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#e5e5e5' } },
    axisLabel: { color: '#737373' },
    axisTick: { alignWithLabel: true },
  },
}

// Same light theme for dark mode (no dark mode)
const minimalDarkTheme = {
  color: ['#EA6A47', '#6b7280', '#34d399', '#f59e0b', '#a78bfa'],
  backgroundColor: 'transparent',
  textStyle: {
    color: '#1f1f1f',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  title: {
    textStyle: {
      color: '#1f1f1f',
    },
    subtextStyle: {
      color: '#737373',
    },
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    textStyle: {
      color: '#1f1f1f',
    },
    shadowBlur: 8,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
  },
  grid: {
    top: 32,
    left: 16,
    right: 16,
    bottom: 16,
    containLabel: true,
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#e5e5e5' } },
    splitLine: { lineStyle: { color: '#f5f5f5' } },
    axisLabel: { color: '#737373' },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#e5e5e5' } },
    axisLabel: { color: '#737373' },
    axisTick: { alignWithLabel: true },
  },
}
