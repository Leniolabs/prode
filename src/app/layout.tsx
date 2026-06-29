import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { cookies } from 'next/headers'
import { PwaRegistration } from '@/components/common/PwaRegistration'
import SessionWrapper from '@/components/common/SessionWrapper/SessionWrapper'
import QueryProvider from '@/components/common/QueryProvider/QueryProvider'
import { LocaleProvider } from '@/locale'
import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_COOKIE } from '@/locale/shared'
import '@/styles/globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prode',
  description:
    'Join the Improving Prode (lottery) and put your prediction skills to the test. Pick your winners, compete with your coworkers, and see who comes out on top for the FIFA World Cup 2026.',
  applicationName: 'Prode',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Prode',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Prode',
    description:
      'Join the Improving Prode (lottery) and put your prediction skills to the test. Pick your winners, compete with your coworkers, and see who comes out on top for the FIFA World Cup 2026.',
    images: ['/meta.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#005596',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  return (
    <html lang={locale} className={poppins.variable}>
      <body>
        <SessionWrapper>
          <QueryProvider>
            <LocaleProvider initialLocale={locale}>
              <PwaRegistration />
              {children}
            </LocaleProvider>
          </QueryProvider>
        </SessionWrapper>
      </body>
    </html>
  )
}
