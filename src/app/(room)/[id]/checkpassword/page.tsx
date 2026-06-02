'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { HeaderMessage, LeniBall } from '@/components/common/Header'
import { Layout, Header, Container } from '@/layout'
import { PasswordModal } from '@/components/common/PasswordModal'
import { useLocalizedText } from '@/locale'
import { useParams } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const i18n = useLocalizedText()

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
        <PasswordModal onClose={handlePassword} />
      </Container>
    </Layout>
  )
}
