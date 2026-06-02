'use client'
import React from 'react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Layout, Footer, Container } from '@/layout'
import { Button } from '@/components/common/Button'
import { HomeTitle } from '@/components/common/HomeTitle'
import Image from 'next/image'
import { LeniCamel, Register } from '@/components/view/Index'
import { useSession } from 'next-auth/react'
import { LocaleSelect } from '@/components/common/LocaleSelect'

interface LoginClientProps {
  authError?: 'OAuthAccountNotLinked'
  callbackUrl?: string
}

export default function LoginClient(props: LoginClientProps) {
  const session = useSession()

  return (
    <Layout>
      <Container direction="COL">
        <Image src="/qatar.png" alt="Qatar Logo" width={200} height={200} />
        <HomeTitle>Lenio Prode</HomeTitle>
        {session.status === 'unauthenticated' && (
          <Register authError={props.authError} />
        )}
        {session.status === 'authenticated' && (
          <Button href="/rooms">Entrar</Button>
        )}
        <LeniCamel />
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  )
}
