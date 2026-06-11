'use client'
import React from 'react'
import { HeaderMessage, LeniBall } from '@/components/common/Header'
import { Layout, Header, Container } from '@/layout'
import { useRequireSession } from '@/hooks'
import { PasswordModal } from '@/components/common/PasswordModal'
import axios from 'axios'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useLocalizedText } from '@/locale'

export default function CheckPasswordPage() {
  const session = useRequireSession()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const i18n = useLocalizedText()
  const [error, setError] = React.useState("")

  const { data } = useQuery<{ userRanking?: { background?: string } }>({
    queryKey: ['checkpassword-page-data', id],
    queryFn: () => fetch(`/api/view-page-data?id=${id}`).then((r) => r.json()),
  })

  const handlePassword = React.useCallback(
    (password: string) => {
      axios
        .post(`/api/${id}/checkpassword`, { password })
        .then((response) => {
          const allowed = response.data?.allowed as boolean
          if (allowed) {
            setError("")
            router.push(`/${id}/ranking`)
            return
          }
          if (response.data?.code === "EMAIL_DOMAIN") {
            setError(i18n.passwordCheckEmailDomain)
            return
          }
          if (response.data?.code === "WRONG_PASSWORD") {
            setError(i18n.passwordCheckWrong)
            return
          }
          setError(i18n.passwordCheckError)
        })
        .catch(() => {
          // axios rejects on any non-2xx — surface a message instead of a
          // silent no-op when the request fails.
          setError(i18n.passwordCheckError)
        })
    },
    [id, router, i18n]
  )

  if (session.status === 'loading' || session.status === 'unauthenticated') return null

  return (
    <Layout>
      <Header>
        <HeaderMessage
          title={i18n.headerTitle}
          subtitle={
            <>
              {i18n.headerWelcomeLine}
              <br />
              {i18n.headerWelcomeLine1}
              <br />
              <span>{i18n.headerWelcomeLine2}</span>.
            </>
          }
        />
        <LeniBall />
      </Header>
      <Container>
        <PasswordModal error={error} onClose={handlePassword} />
      </Container>
    </Layout>
  )
}
