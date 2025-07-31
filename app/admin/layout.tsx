import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel - Orders Dashboard',
  description: 'Manage and track all customer orders for the mousepad customizer',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <div style={{ 
          width: '100vw', 
          height: '100vh', 
          overflow: 'auto',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {children}
        </div>
      </body>
    </html>
  )
} 