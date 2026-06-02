'use client'
import React from 'react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Layout, Footer, Container } from '@/layout'
import Image from 'next/image'
import { LeniCamel } from '@/components/view/Index'
import { LocaleSelect } from '@/components/common/LocaleSelect'

export default function BlockedClient() {
  return (
    <Layout>
      <Container direction="COL">
        <Image src="/qatar.png" alt="Qatar Logo" width={200} height={200} />
        <LeniCamel />
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  )
}
