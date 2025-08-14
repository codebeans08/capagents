import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cape Agents - Property Search',
  description: 'Enter property code to view details',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/favicon.ico', // Path relative to /public
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}