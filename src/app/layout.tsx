import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import SessionWrapper from '@/components/common/SessionWrapper/SessionWrapper'
import QueryProvider from '@/components/common/QueryProvider/QueryProvider'
import '@/styles/globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prode',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={poppins.variable}>
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
