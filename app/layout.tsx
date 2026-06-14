import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from app/components/navbar.tsx

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Galleria',
  description: 'Discover, book and discuss events in your city',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  )
}