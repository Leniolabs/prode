'use client'
import React from 'react'
import { HeaderMessage, LeniBall } from '@/components/common/Header'
import { Layout, Header, Container } from '@/layout'
import { useRequireSession } from '@/hooks'
import { PasswordModal } from '@/components/common/PasswordModal'
import axios from 'axios'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import { useLocalizedText } from '@/locale'

export default function CheckPasswordPage() {
  const session = useRequireSession()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const i18n = useLocalizedText()

  const { data } = useQuery(['checkpassword-page-data', id], () =>
    fetch(`/api/view-page-data?id=${id}`).then((r) => r.json())
  )

  const handlePassword = React.useCallback(
    (password: string) => {
      axios.post(`/api/${id}/checkpassword`, { password }).then((response) => {
        const allowed = response.data?.allowed as boolean
        if (allowed) {
          router.push(`/${id}/ranking`)
        } else {
          router.push(`/${id}/groups`)
        }
      })
    },
    [id, router]
  )

  if (session.status === 'loading' || session.status === 'unauthenticated') return null

  return (
    <Layout backgroundImage={`/${data?.userRanking?.background}.png`}>
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
        <PasswordModal onClose={handlePassword} />
      </Container>
    </Layout>
  )
}
