
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/app/components/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Galleria',
  description: 'Discover and book events in Nairobi',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Galleria',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  )
}