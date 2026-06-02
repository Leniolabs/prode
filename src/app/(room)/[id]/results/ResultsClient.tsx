'use client'
import React from 'react'
import { ProdeRoom, User } from '@/generated/prisma'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Button } from '@/components/common/Button'
import { DesktopHeader, MobileHeader } from '@/components/common/Header'
import { Layout, Footer, Container } from '@/layout'
import { Winners } from '@/components/view/Winners'
import { LocaleSelect } from '@/components/common/LocaleSelect'
import { useLocalizedText } from '@/locale'

interface ResultsClientProps {
  id: string
  name: string
  roomAdmin: boolean
  finalsStarted?: boolean
  room?: Pick<ProdeRoom, 'id' | 'name' | 'emailDomain' | 'password' | 'pointsGoals' | 'pointsPenal' | 'pointsWinner' | 'public'>
  userRanking: Pick<User, 'id' | 'name' | 'image' | 'email' | 'prodePublic' | 'background' | 'dark'> & {
    points: number
    ranking: number
  }
  ranking: (Pick<User, 'id' | 'name' | 'image' | 'email'> & { points: number; ranking: number })[]
}

export default function ResultsClient(props: ResultsClientProps) {
  const i18n = useLocalizedText()

  return (
    <Layout backgroundImage={`/${props.userRanking?.background}.png`}>
      <DesktopHeader id={props.id} name={props.name} room={props.room} userRanking={props.userRanking} roomAdmin={props.roomAdmin}>
        <Button invert href="/rooms">{i18n.buttonLabelProdeList}</Button>
        <Button invert href={`/${props.id}/ranking`}>{i18n.buttonLabelRanking}</Button>
      </DesktopHeader>
      <MobileHeader list id={props.id} finalsStarted={props.finalsStarted} name={props.name} room={props.room} userRanking={props.userRanking} roomAdmin={props.roomAdmin} groups={true} finals={true} />
      <Container noPadding full>
        <Winners
          firstPlace={props.ranking?.find((row) => row.ranking === 1)}
          secondPlace={props.ranking?.find((row) => row.ranking === 2)}
          thirdPlace={props.ranking?.find((row) => row.ranking === 3)}
          fourthPlace={props.ranking?.find((row) => row.ranking === 4)}
        />
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  )
}
