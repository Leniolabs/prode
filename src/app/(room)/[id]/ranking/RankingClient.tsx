'use client'
import React from 'react'
import { ProdeRoom, User } from '@/generated/prisma'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Button } from '@/components/common/Button'
import { DesktopHeader, MobileHeader } from '@/components/common/Header'
import { Pagination, Table } from '@/components/common/Table'
import { UserPositionDisplay } from '@/components/common/UserPositionDisplay'
import { UserRankingDisplay } from '@/components/common/UserRankingDisplay'
import { Layout, Footer, Container, Card, ContainerHeader, CardContent } from '@/layout'
import { useRouter } from 'next/navigation'
import { LocaleSelect } from '@/components/common/LocaleSelect'
import { useLocalizedText } from '@/locale'
import { ButtonIcon } from '@/components/common/ButtonIcon'
import { CloseIcon, CrownIcon, ExitIcon } from '@/components/common/Icons'
import axios from 'axios'

interface RankingRow {
  id: string
  userId?: string
  name: string | null
  image: string | null
  email: string | null
  prodePublic?: boolean
  dark?: boolean | null
  background?: string | null
  points: number
  ranking: number
  GROUP_A?: number
  GROUP_B?: number
  GROUP_C?: number
  GROUP_D?: number
  GROUP_E?: number
  GROUP_F?: number
  GROUP_G?: number
  GROUP_H?: number
  FINALS_8?: number
  FINALS_4?: number
  FINALS_2?: number
  FINAL?: number
  isAdmin?: boolean
}

interface RankingClientProps {
  id: string
  name: string
  roomAdmin: boolean
  userProdeId: string
  finalsStarted: boolean
  room?: Pick<ProdeRoom, 'id' | 'name' | 'emailDomain' | 'password' | 'pointsGoals' | 'pointsPenal' | 'pointsWinner' | 'public'>
  totalPlayers: number
  totalPages: number
  page: number
  userRanking: RankingRow & { isAdmin: boolean }
  ranking: RankingRow[]
}

export default function RankingClient(props: RankingClientProps) {
  const router = useRouter()
  const i18n = useLocalizedText()

  const handleUserClick = React.useCallback((row: RankingRow) => {
    router.push(`/${row.id}/view`)
  }, [router])

  const handleLeaveRoom = React.useCallback(() => {
    if (confirm('Estas seguro?')) {
      axios.delete(`/api/${props.userProdeId}/leave`).then(() => {
        router.push('/rooms')
      })
    }
  }, [props.userProdeId, router])

  const handleRemoveUser = React.useCallback(
    (userProdeId: string) => {
      return () => {
        if (confirm('Estas seguro de eliminar este Usuario?')) {
          axios.delete(`/api/${userProdeId}/delete`).then(() => {
            router.refresh()
          }).catch(() => {})
        }
      }
    },
    [props.id, router]
  )

  return (
    <Layout backgroundImage={`/${props.userRanking?.background}.png`}>
      <DesktopHeader id={props.id} name={props.name} room={props.room} userRanking={props.userRanking ? { ...props.userRanking, prodePublic: props.userRanking.prodePublic ?? false, dark: props.userRanking.dark ?? false, background: props.userRanking.background ?? '' } : undefined} roomAdmin={props.roomAdmin}>
        <Button invert href="/rooms">{i18n.buttonLabelProdeList}</Button>
        {props.finalsStarted ? (
          <Button invert href={`/${props.id}/finals`}>{i18n.buttonLabelFinalsPhase}</Button>
        ) : (
          <Button invert href={`/${props.id}/groups`}>{i18n.buttonLabelGroupPhase}</Button>
        )}
      </DesktopHeader>
      <MobileHeader list id={props.id} finalsStarted={props.finalsStarted} name={props.name} room={props.room} userRanking={props.userRanking ? { ...props.userRanking, prodePublic: props.userRanking.prodePublic ?? false, dark: props.userRanking.dark ?? false, background: props.userRanking.background ?? '' } : undefined} roomAdmin={props.roomAdmin} groups={true} finals={true} shareUserProdeId={props.userProdeId} />
      <Container full direction="COL">
        <ContainerHeader
          sticky
          title={
            <>
              {i18n.rankingTitle}
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                {i18n.rankingTotalPlayersLabel} {props.totalPlayers}
              </div>
            </>
          }
        >
          <Button onClick={() => { navigator.clipboard.writeText(`${window.location.href}`) }}>
            {i18n.buttonLabelCopyLink}
          </Button>
          <Button onClick={handleLeaveRoom} variant="danger">
            <ExitIcon /> {i18n.buttonLabelLeave}
          </Button>
        </ContainerHeader>
        <Card>
          <CardContent>
            <Table
              onRowClick={handleUserClick}
              columns={[
                { header: '', width: '32px', accesor: (row) => {
                  if (row.isAdmin) return <ButtonIcon><CrownIcon /></ButtonIcon>
                  if (props.roomAdmin) return <ButtonIcon onClick={handleRemoveUser(row.id)}><CloseIcon color="#333" /></ButtonIcon>
                  return null
                }},
                { header: i18n.rankingPositionColumn, accesor: (row) => <UserPositionDisplay position={row.ranking} />, width: '50px' },
                { header: i18n.rankingNameColumn, accesor: (row) => <UserRankingDisplay name={row.name || ''} image={row.image} /> },
                { header: 'A', accesor: (row) => row.GROUP_A, align: 'RIGHT', hideInMobile: true },
                { header: 'B', accesor: (row) => row.GROUP_B, align: 'RIGHT', hideInMobile: true },
                { header: 'C', accesor: (row) => row.GROUP_C, align: 'RIGHT', hideInMobile: true },
                { header: 'D', accesor: (row) => row.GROUP_D, align: 'RIGHT', hideInMobile: true },
                { header: 'E', accesor: (row) => row.GROUP_E, align: 'RIGHT', hideInMobile: true },
                { header: 'F', accesor: (row) => row.GROUP_F, align: 'RIGHT', hideInMobile: true },
                { header: 'G', accesor: (row) => row.GROUP_G, align: 'RIGHT', hideInMobile: true },
                { header: 'H', accesor: (row) => row.GROUP_H, align: 'RIGHT', hideInMobile: true },
                { header: i18n.ranking8Column, accesor: (row) => row.FINALS_8, align: 'RIGHT', hideInMobile: true },
                { header: i18n.ranking4Column, accesor: (row) => row.FINALS_4, align: 'RIGHT', hideInMobile: true },
                { header: i18n.ranking2Column, accesor: (row) => row.FINALS_2, align: 'RIGHT', hideInMobile: true },
                { header: i18n.ranking1Column, accesor: (row) => row.FINAL, align: 'RIGHT', hideInMobile: true },
                { header: i18n.rankingTotalColumn, accesor: (row) => row.points, align: 'RIGHT', width: '50px' },
              ]}
              data={props.ranking || []}
              clickable
            />
          </CardContent>
        </Card>
        <Pagination page={props.page} totalPages={props.totalPages} />
      </Container>
      <Footer>
        <BrandLogo />
      </Footer>
    </Layout>
  )
}
