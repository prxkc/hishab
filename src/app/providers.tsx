import { ThemeProvider } from './theme-provider'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider defaultTheme="dark">
      {children}
    </ThemeProvider>
  )
}
