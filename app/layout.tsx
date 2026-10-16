import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'MARS Cash Flow', description: 'Your money. Your decisions. Your progress.' }
export const viewport: Viewport = { themeColor: '#071d18', width: 'device-width', initialScale: 1, userScalable: false }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><link rel="manifest" href="/manifest.webmanifest" />{children}</body></html>
}
