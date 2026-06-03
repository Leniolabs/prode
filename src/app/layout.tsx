import type { Metadata } from 'next'
import SessionWrapper from '@/components/common/SessionWrapper/SessionWrapper'
import QueryProvider from '@/components/common/QueryProvider/QueryProvider'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Prode',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionWrapper>
          <QueryProvider>
            {children}
          </QueryProvider>
        </SessionWrapper>
      </body>
    </html>
  )
}
