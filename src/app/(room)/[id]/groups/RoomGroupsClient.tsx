'use client'
import React from 'react'
import { Match, ProdeRoom, Stage, User } from '@/generated/prisma'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Button } from '@/components/common/Button'
import { DesktopHeader, MobileHeader } from '@/components/common/Header'
import { MatchInput } from '@/components/common/MatchInput'
import { Table } from '@/components/common/Table'
import { UserPositionDisplay } from '@/components/common/UserPositionDisplay'
import { UserRankingDisplay } from '@/components/common/UserRankingDisplay'
import { Layout, Footer, Container, Card, ContainerHeader, CardFooter, CardContent } from '@/layout'
import commonStyles from '@/styles/CommonStyles.module.scss'
import { filterUniquePredicate } from '@/utils/array'
import axios from 'axios'
import { CardsContainer, GroupsContainer, GroupsResultsWarning, LeniCard } from '@/components/view/Groups'
import { useRouter } from 'next/navigation'
import { LocaleSelect } from '@/components/common/LocaleSelect'
import { useLocalizedText } from '@/locale'
import { getNextMatches, getTodayMatches } from '@/utils/date'
import { DailyMatches, DailyMatchInput } from '@/components/common/DailyMatches'
import { ShareToday } from '@/components/common/ShareButton/ShareToday'
import { GapIcon } from '@/components/common/Icons'
import { Warning } from '@/components/common/Warning'

type UIMatch = {
  id: string
  stage: Stage
  date: string | Date
  filled: boolean
  goalsLeft: number | null
  goalsRight: number | null
  countryLeftId: string | null
  userGoalsLeft?: number | null
  disabled: boolean
  countryRightId: string | null
  userGoalsRight?: number | null
  resultStatus?: string | null
}

interface Ranking {
  id: string
  name: string | null
  image: string | null
  email: string | null
  points: number
  ranking: number
  gap?: boolean
}

interface RoomGroupsClientProps {
  id: string
  name: string
  roomAdmin: boolean
  userProdeId: string
  room?: Pick<ProdeRoom, 'id' | 'name' | 'emailDomain' | 'password' | 'pointsGoals' | 'pointsPenal' | 'pointsWinner' | 'public'>
  finalsStarted: boolean
  userRanking?: Pick<User, 'id' | 'name' | 'image' | 'email' | 'prodePublic' | 'background' | 'dark'> & { points: number; ranking: number }
  ranking?: Ranking[]
  matches?: UIMatch[]
  todayMatches?: UIMatch[] | null
  nextMatches?: UIMatch[] | null
}

export default function RoomGroupsClient(props: RoomGroupsClientProps) {
  const router = useRouter()
  const i18n = useLocalizedText()

  const { todayMatches: _todayMatches, nextMatches: _nextMatches } = props

  const [updating, setUpdating] = React.useState(false)
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>(props.matches || [])
  const [matches, setMatches] = React.useState<UIMatch[]>(props.matches || [])

  const todayMatches = React.useMemo(() => {
    return _todayMatches?.map((match) => matches.find((m) => m.id === match.id) || match)
  }, [_todayMatches, matches])
  const nextMatches = React.useMemo(() => {
    return _nextMatches?.map((match) => matches.find((m) => m.id === match.id) || match)
  }, [_nextMatches, matches])

  const handleGoalsChange = React.useCallback(
    (id: string, userGoalsLeft: number | null, userGoalsRight: number | null) => {
      setMatches((matches) => matches.map((match) => (match.id === id ? { ...match, userGoalsLeft, userGoalsRight } : match)))
    },
    []
  )

  const differentMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const originalMatch = originalMatches.find((m) => m.id === match.id)
      if (!originalMatch) return false
      return originalMatch.userGoalsLeft !== match.userGoalsLeft || originalMatch.userGoalsRight !== match.userGoalsRight
    })
  }, [originalMatches, matches])

  const isModified = React.useMemo(() => !!differentMatches.length, [originalMatches, matches])

  const handleSave = React.useCallback(() => {
    setUpdating(true)
    axios
      .post(`/api/${props.id}/groups`, {
        matches: differentMatches
          .map((match) => ({ matchId: match.id, goalsLeft: match.userGoalsLeft, goalsRight: match.userGoalsRight }))
          .filter((match) => (match.goalsLeft || match.goalsLeft === 0) && (match.goalsRight || match.goalsRight === 0)),
      })
      .then(() => {
        setOriginalMatches(matches)
        setTimeout(() => setUpdating(false), 500)
      })
  }, [props.id, differentMatches, matches])

  const handleUserClick = React.useCallback((row: Ranking) => {
    if (row?.id) router.push(`/${row.id}/view`)
  }, [router])

  return (
    <Layout backgroundImage={`/${props.userRanking?.background}.png`}>
      <DesktopHeader id={props.id} name={props.name} room={props.room} userRanking={props.userRanking} roomAdmin={props.roomAdmin}>
        <Button invert href="/rooms">{i18n.buttonLabelProdeList}</Button>
        <Button disabled={!props.finalsStarted} invert href={`/${props.id}/finals`}>{i18n.buttonLabelFinalsPhase}</Button>
      </DesktopHeader>
      <MobileHeader list id={props.id} name={props.name} room={props.room} finalsStarted={props.finalsStarted} userRanking={props.userRanking} roomAdmin={props.roomAdmin} groups={true} finals={true} shareUserProdeId={props.userProdeId} />
      {props.room && (
        <GroupsResultsWarning roomConfig={{ pointsGoals: props.room.pointsGoals, pointsWinner: props.room.pointsWinner, pointsPenal: props.room.pointsPenal }} />
      )}
      <Container full>
        <GroupsContainer>
          <ContainerHeader sticky title={i18n.groupsTitle} gridArea="matches-header">
            <Button disabled={!isModified} className={commonStyles.marginLeftAuto} onClick={handleSave}>
              {updating ? i18n.buttonLabelSaving : i18n.buttonLabelSave}
            </Button>
          </ContainerHeader>
          <CardsContainer gridArea="matches">
            {['GROUP_A','GROUP_B','GROUP_C','GROUP_D','GROUP_E','GROUP_F','GROUP_G','GROUP_H','GROUP_I','GROUP_J','GROUP_K','GROUP_L'].map((group) => (
              // @ts-ignore
              <Card key={group} title={i18n[group]}>
                <CardContent>
                  {matches.filter((match) => match.stage === group).map((match) => (
                    <MatchInput
                      key={match.id}
                      disabled={match.disabled}
                      date={new Date(match.date)}
                      countryLeftId={match.countryLeftId ?? ''}
                      goalsLeft={match.goalsLeft}
                      countryRightId={match.countryRightId ?? ''}
                      goalsRight={match.goalsRight}
                      onChange={(leftGoals, rightGoals) => handleGoalsChange(match.id, leftGoals, rightGoals)}
                      filled={match.filled}
                      userGoalsLeft={match.userGoalsLeft}
                      userGoalsRight={match.userGoalsRight}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
            <LeniCard />
          </CardsContainer>
          <Card title={<>{todayMatches ? i18n.todayMatchesLabel : i18n.upcomingMatchesLabel}<ShareToday userProdeId={props.userProdeId} /></>} gridArea="following">
            <CardContent>
              {(todayMatches || nextMatches)?.length ? (
                <DailyMatches>
                  {(todayMatches || nextMatches)?.map((match) => (
                    <DailyMatchInput
                      key={match.id}
                      disabled={match.disabled}
                      date={new Date(match.date)}
                      today={!!todayMatches}
                      countryLeftId={match.countryLeftId ?? ''}
                      goalsLeft={match.goalsLeft}
                      countryRightId={match.countryRightId ?? ''}
                      goalsRight={match.goalsRight}
                      onChange={(leftGoals, rightGoals) => handleGoalsChange(match.id, leftGoals, rightGoals)}
                      filled={match.filled}
                      userGoalsLeft={match.userGoalsLeft}
                      userGoalsRight={match.userGoalsRight}
                    />
                  ))}
                </DailyMatches>
              ) : (
                <div style={{ padding: '12px', textAlign: 'center' }}>{i18n.noMoreMatches}</div>
              )}
            </CardContent>
          </Card>
          <Card title={i18n.rankingTitle} gridArea="ranking">
            <CardContent>
              <Table
                columns={[
                  { header: i18n.rankingPositionColumn, accesor: (row) => !row.gap && <UserPositionDisplay position={row.ranking} />, width: '50px' },
                  { header: i18n.rankingNameColumn, accesor: (row) => row.gap ? <GapIcon /> : <UserRankingDisplay name={row.name || ''} image={row.image} /> },
                  { header: i18n.rankingTotalColumn, accesor: (row) => (!row.gap ? row.points : ''), align: 'RIGHT', width: '50px' },
                ]}
                onRowClick={handleUserClick}
                data={props.ranking || []}
                clickable={(row) => !row.gap}
              />
            </CardContent>
            <CardFooter>
              <Button href={`/${props.id}/ranking`} variant="secondary">{i18n.buttonCompleteRanking}</Button>
            </CardFooter>
          </Card>
        </GroupsContainer>
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  )
}
