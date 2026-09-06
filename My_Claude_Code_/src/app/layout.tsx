import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Systems & Accessibility Research | Anirudh Yadav',
  description: 'Cyber-physical security, WCAG accessibility engines, and algorithmic memory profiling.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-blue-600 focus:text-white focus:z-50">
          Skip to main content
        </a>
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  )
}
