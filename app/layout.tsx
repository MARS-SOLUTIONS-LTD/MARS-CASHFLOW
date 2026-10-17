import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Suspense } from 'react'
import { ThemeProvider } from '@/lib/hooks/useTheme'
import { AuthProvider } from '@/lib/hooks/useAuth'

export const metadata: Metadata = { title: 'MARS Cash Flow', description: 'Your money. Your decisions. Your progress.' }
export const viewport: Viewport = { themeColor: '#071d18', width: 'device-width', initialScale: 1, userScalable: false }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <link rel="manifest" href="/manifest.webmanifest" />
        <ThemeProvider>
          <Suspense fallback={<div aria-hidden="true" />}>
            <AuthProvider>{children}</AuthProvider>
          </Suspense>
        </ThemeProvider>

        <noscript>
          <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground">
            This app requires JavaScript to run.
          </div>
        </noscript>
      </body>
    </html>
  )
}
