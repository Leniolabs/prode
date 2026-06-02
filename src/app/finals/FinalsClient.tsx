'use client'
import React from 'react'
import { Stage, User } from '@/generated/prisma'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Button } from '@/components/common/Button'
import { DesktopHeader, MobileHeader } from '@/components/common/Header'
import { Layout, Footer, Container, Card, ContainerHeader, CardContent } from '@/layout'
import axios from 'axios'
import { UserMatchFinalsInput } from '@/components/common/UserMatchFinalsInput'
import {
  BracketsContainer,
  FinalsContainer,
  BracketIcon,
  BracketTitle,
  bracketOffsetQuarter,
  BracketsMobileContainer,
} from '@/components/view/Finals'
import { className } from '@/utils/classname'
import { Collapsable, CollapsableContainer } from '@/components/common/Collapsable'
import { Warning } from '@/components/common/Warning'
import Link from 'next/link'
import { LocaleSelect } from '@/components/common/LocaleSelect'
import { useLocalizedText } from '@/locale'
import { DailyMatches, DailyMatchFinalInput } from '@/components/common/DailyMatches'

type UIMatch = {
  id: string
  stage: Stage
  date: string | Date
  filled: boolean
  goalsLeft: number | null
  goalsRight: number | null
  penaltisLeft: number | null
  penaltisRight: number | null
  countryLeftId?: string | null
  userCountryLeftId?: string | null
  userGoalsLeft?: number | null
  userPenaltisLeft?: number | null
  disabled: boolean
  countryRightId?: string | null
  userCountryRightId?: string | null
  userGoalsRight?: number | null
  userPenaltisRight?: number | null
  resultStatus?: string | null
  countryStatus?: string | null
}

export const getMatchOrder = (matchStage: Stage, mobile?: boolean) => {
  if (mobile) {
    switch (matchStage) {
      case 'FINALS_8_1': return 1
      case 'FINALS_8_2': return 2
      case 'FINALS_8_3': return 3
      case 'FINALS_8_4': return 4
      case 'FINALS_8_5': return 5
      case 'FINALS_8_6': return 6
      case 'FINALS_8_7': return 7
      case 'FINALS_8_8': return 8
      case 'FINALS_4_1': return 9
      case 'FINALS_4_2': return 10
      case 'FINALS_4_3': return 11
      case 'FINALS_4_4': return 12
      case 'FINALS_2_1': return 13
      case 'FINALS_2_2': return 14
      case 'FINALS': return 15
      case 'THIRD_PLACE': return 16
      default: return 0
    }
  }

  switch (matchStage) {
    case 'FINALS_8_1': return 1
    case 'FINALS_8_3': return 5
    case 'FINALS_8_5': return 2
    case 'FINALS_8_7': return 6
    case 'FINALS_8_2': return 7
    case 'FINALS_8_4': return 3
    case 'FINALS_8_6': return 4
    case 'FINALS_8_8': return 8
    case 'FINALS_4_1': return 10
    case 'FINALS_4_3': return 11
    case 'FINALS_4_2': return 12
    case 'FINALS_4_4': return 13
    case 'FINALS_2_1': return 15
    case 'FINALS_2_2': return 16
    case 'FINALS': return 18
    case 'THIRD_PLACE': return 19
    default: return 0
  }
}

interface FinalsClientProps {
  submissionsEnded: boolean
  finalsStarted: boolean
  matches: UIMatch[]
  todayMatches?: UIMatch[] | null
  nextMatches?: UIMatch[] | null
  userRanking?: Pick<
    User,
    'id' | 'name' | 'image' | 'email' | 'prodePublic' | 'dark' | 'background'
  >
  userProdeId: string
}

export default function FinalsClient(props: FinalsClientProps) {
  const i18n = useLocalizedText()

  const { todayMatches: _todayMatches, nextMatches: _nextMatches } = props

  const [updating, setUpdating] = React.useState(false)
  const [matches, setMatches] = React.useState<UIMatch[]>(props.matches)
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>(props.matches || [])

  const computedMatches = React.useMemo(() => matches, [matches])

  const todayMatches = React.useMemo(() => {
    return _todayMatches?.map((match) => computedMatches.find((m) => m.id === match.id) || match)
  }, [_todayMatches, computedMatches])
  const nextMatches = React.useMemo(() => {
    return _nextMatches?.map((match) => computedMatches.find((m) => m.id === match.id) || match)
  }, [_nextMatches, computedMatches])

  const handleMatchChange = React.useCallback(
    (id: string) => {
      return (value: {
        countryLeftId: string | undefined
        goalsLeft: number | null
        countryRightId: string | undefined
        goalsRight: number | null
        penaltisLeft: number | null
        penaltisRight: number | null
      }) => {
        setMatches(
          computedMatches.map((match) =>
            match.id === id
              ? {
                  ...match,
                  userCountryLeftId: value.countryLeftId,
                  userGoalsLeft: value.goalsLeft ?? null,
                  userCountryRightId: value.countryRightId,
                  userGoalsRight: value.goalsRight ?? null,
                  userPenaltisLeft: value.penaltisLeft ?? null,
                  userPenaltisRight: value.penaltisRight ?? null,
                }
              : match
          )
        )
      }
    },
    [computedMatches]
  )

  const differentMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const originalMatch = originalMatches.find((m) => m.id === match.id)
      if (!originalMatch) return false
      if (
        originalMatch.userGoalsLeft !== match.userGoalsLeft ||
        originalMatch.userGoalsRight !== match.userGoalsRight ||
        originalMatch.userPenaltisLeft !== match.userPenaltisLeft ||
        originalMatch.userPenaltisRight !== match.userPenaltisRight
      )
        return true
      return false
    })
  }, [originalMatches, matches])

  const isModified = React.useMemo(() => !!differentMatches.length, [originalMatches, matches])

  const handleSave = React.useCallback(() => {
    setUpdating(true)
    axios
      .post(`/api/finals`, {
        matches: differentMatches
          .map((match) => ({
            matchId: match.id,
            goalsLeft: match.userGoalsLeft,
            goalsRight: match.userGoalsRight,
            countryLeftId: match.userCountryLeftId,
            countryRightId: match.userCountryRightId,
            penaltisLeft: match.userPenaltisLeft,
            penaltisRight: match.userPenaltisRight,
          }))
          .filter(
            (match) =>
              (match.goalsLeft || match.goalsLeft === 0) &&
              (match.goalsRight || match.goalsRight === 0)
          ),
      })
      .then(() => {
        setOriginalMatches(matches)
        setTimeout(() => {
          setUpdating(false)
        }, 500)
      })
  }, [differentMatches, matches])

  return (
    <Layout backgroundImage={`/${props.userRanking?.background}.png`}>
      <DesktopHeader userRanking={props.userRanking}>
        <Button invert href="/rooms">
          {i18n.buttonLabelProdeList}
        </Button>
        <Button invert href="/groups">
          {i18n.buttonLabelGroupPhase}
        </Button>
      </DesktopHeader>
      <MobileHeader finalsStarted={true} userRanking={props.userRanking} shareUserProdeId={props.userProdeId} />
      <Warning offset>
        {i18n.groupsWarning}{' '}
        <Link href="/rooms" legacyBehavior>
          <a>{i18n.groupsWarningLink}</a>
        </Link>
      </Warning>
      <Container full>
        <FinalsContainer full>
          <ContainerHeader sticky title="FINALES">
            {!props.submissionsEnded && (
              <Button disabled={!isModified} onClick={handleSave}>
                {updating ? i18n.buttonLabelSaving : i18n.buttonLabelSave}
              </Button>
            )}
          </ContainerHeader>
          <BracketsContainer gridArea="matches">
            <BracketTitle full order={0}>{i18n.FINALS_8}</BracketTitle>
            {computedMatches
              .filter((x) => x.stage.includes('FINALS_8_'))
              .sort((a, b) => (a.stage > b.stage ? 1 : -1))
              .map((match) => (
                <UserMatchFinalsInput
                  disabled={match.disabled || props.submissionsEnded}
                  key={match.id}
                  date={new Date(match.date)}
                  userCountryLeftId={match.countryLeftId ?? undefined}
                  userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.countryRightId ?? undefined}
                  userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft}
                  userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft}
                  penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft}
                  goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId ?? undefined}
                  countryRightId={match.countryRightId ?? undefined}
                  onChange={handleMatchChange(match.id)}
                  order={getMatchOrder(match.stage)}
                  filled={match.filled}
                />
              ))}
            <BracketIcon order={9} />
            <BracketIcon order={9} />
            <BracketIcon order={9} />
            <BracketIcon order={9} />
            <BracketTitle order={9} full>{i18n.FINALS_4}</BracketTitle>
            {computedMatches
              .filter((x) => x.stage.includes('FINALS_4_'))
              .sort((a, b) => (a.stage > b.stage ? 1 : -1))
              .map((match) => (
                <UserMatchFinalsInput
                  showCountryStatus
                  disabled={match.disabled || props.submissionsEnded}
                  key={match.id}
                  date={new Date(match.date)}
                  userCountryLeftId={match.userCountryLeftId ?? undefined}
                  userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.userCountryRightId ?? undefined}
                  userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft}
                  userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft}
                  penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft}
                  goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId ?? undefined}
                  countryRightId={match.countryRightId ?? undefined}
                  onChange={handleMatchChange(match.id)}
                  order={getMatchOrder(match.stage)}
                  filled={match.filled}
                />
              ))}
            <BracketIcon order={14} big />
            <BracketIcon order={14} big />
            <BracketTitle className={className(bracketOffsetQuarter)} order={14} full>{i18n.FINALS_2}</BracketTitle>
            {computedMatches
              .filter((x) => x.stage.includes('FINALS_2_'))
              .sort((a, b) => (a.stage > b.stage ? 1 : -1))
              .map((match, index) => (
                <UserMatchFinalsInput
                  showCountryStatus
                  key={match.id}
                  disabled={match.disabled || props.submissionsEnded}
                  className={className(index === 0 && bracketOffsetQuarter)}
                  date={new Date(match.date)}
                  userCountryLeftId={match.userCountryLeftId ?? undefined}
                  userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.userCountryRightId ?? undefined}
                  userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft}
                  userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft}
                  penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft}
                  goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId ?? undefined}
                  countryRightId={match.countryRightId ?? undefined}
                  onChange={handleMatchChange(match.id)}
                  order={getMatchOrder(match.stage)}
                  filled={match.filled}
                />
              ))}
            <BracketIcon className={className(bracketOffsetQuarter)} order={17} big />
            <BracketTitle className={className(bracketOffsetQuarter)} order={17}>{i18n.FINAL}</BracketTitle>
            <BracketTitle order={17}>{i18n.THIRD_PLACE}</BracketTitle>
            {computedMatches
              .filter((x) => x.stage === 'FINALS' || x.stage === 'THIRD_PLACE')
              .sort((a, b) => (a.stage > b.stage ? 1 : -1))
              .map((match, index) => (
                <UserMatchFinalsInput
                  showCountryStatus
                  className={className(index === 0 && bracketOffsetQuarter)}
                  disabled={match.disabled || props.submissionsEnded}
                  key={match.id}
                  date={new Date(match.date)}
                  userCountryLeftId={match.userCountryLeftId ?? undefined}
                  userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.userCountryRightId ?? undefined}
                  userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft}
                  userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft}
                  penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft}
                  goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId ?? undefined}
                  countryRightId={match.countryRightId ?? undefined}
                  onChange={handleMatchChange(match.id)}
                  order={getMatchOrder(match.stage)}
                  filled={match.filled}
                />
              ))}
          </BracketsContainer>
          <BracketsMobileContainer gridArea="matches">
            <CollapsableContainer>
              <Collapsable title={i18n.FINALS_8}>
                {computedMatches
                  .filter((x) => x.stage.includes('FINALS_8_'))
                  .sort((a, b) => (a.date > b.date ? 1 : -1))
                  .map((match, index) => (
                    <UserMatchFinalsInput
                      disabled={match.disabled || props.submissionsEnded}
                      key={match.id}
                      date={new Date(match.date)}
                      userCountryLeftId={match.countryLeftId ?? undefined}
                      userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.countryRightId ?? undefined}
                      userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft}
                      goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId ?? undefined}
                      countryRightId={match.countryRightId ?? undefined}
                      onChange={handleMatchChange(match.id)}
                      order={index + 1}
                      filled={match.filled}
                    />
                  ))}
              </Collapsable>
              <Collapsable title={i18n.FINALS_4}>
                {computedMatches
                  .filter((x) => x.stage.includes('FINALS_4_'))
                  .sort((a, b) => (a.date > b.date ? 1 : -1))
                  .map((match, index) => (
                    <UserMatchFinalsInput
                      showCountryStatus
                      disabled={match.disabled || props.submissionsEnded}
                      key={match.id}
                      date={new Date(match.date)}
                      userCountryLeftId={match.userCountryLeftId ?? undefined}
                      userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.userCountryRightId ?? undefined}
                      userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft}
                      goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId ?? undefined}
                      countryRightId={match.countryRightId ?? undefined}
                      onChange={handleMatchChange(match.id)}
                      order={index + 1 + 8}
                      filled={match.filled}
                    />
                  ))}
              </Collapsable>
              <Collapsable title={i18n.FINALS_2}>
                {computedMatches
                  .filter((x) => x.stage.includes('FINALS_2_'))
                  .sort((a, b) => (a.date > b.date ? 1 : -1))
                  .map((match, index) => (
                    <UserMatchFinalsInput
                      showCountryStatus
                      key={match.id}
                      disabled={match.disabled || props.submissionsEnded}
                      date={new Date(match.date)}
                      userCountryLeftId={match.userCountryLeftId ?? undefined}
                      userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.userCountryRightId ?? undefined}
                      userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft}
                      goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId ?? undefined}
                      countryRightId={match.countryRightId ?? undefined}
                      onChange={handleMatchChange(match.id)}
                      order={index + 1 + 8 + 4}
                      filled={match.filled}
                    />
                  ))}
              </Collapsable>
              <Collapsable title={i18n.FINAL}>
                {computedMatches
                  .filter((x) => x.stage === 'FINALS' || x.stage === 'THIRD_PLACE')
                  .sort((a, b) => (a.date > b.date ? 1 : -1))
                  .map((match, index) => (
                    <UserMatchFinalsInput
                      showCountryStatus
                      disabled={match.disabled || props.submissionsEnded}
                      key={match.id}
                      date={new Date(match.date)}
                      userCountryLeftId={match.userCountryLeftId ?? undefined}
                      userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.userCountryRightId ?? undefined}
                      userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft}
                      goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId ?? undefined}
                      countryRightId={match.countryRightId ?? undefined}
                      onChange={handleMatchChange(match.id)}
                      order={index + 1 + 8 + 4 + 2}
                      filled={match.filled}
                      highlight={match.stage === 'FINALS'}
                    />
                  ))}
              </Collapsable>
            </CollapsableContainer>
          </BracketsMobileContainer>
          <Card
            title={todayMatches ? i18n.todayMatchesLabel : i18n.upcomingMatchesLabel}
            gridArea="following"
          >
            <CardContent>
              {(todayMatches || nextMatches)?.length ? (
                <DailyMatches>
                  {(todayMatches || nextMatches)?.map((match) => (
                    <DailyMatchFinalInput
                      disabled={match.disabled || props.submissionsEnded}
                      key={match.id}
                      today={!!props.todayMatches}
                      date={new Date(match.date)}
                      userCountryLeftId={match.countryLeftId ?? undefined}
                      userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.countryRightId ?? undefined}
                      userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft}
                      goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId ?? undefined}
                      countryRightId={match.countryRightId ?? undefined}
                      onChange={handleMatchChange(match.id)}
                      order={getMatchOrder(match.stage) + 100}
                      filled={match.filled}
                    />
                  ))}
                </DailyMatches>
              ) : (
                <div style={{ padding: '12px', textAlign: 'center' }}>{i18n.noMoreMatches}</div>
              )}
            </CardContent>
          </Card>
        </FinalsContainer>
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  )
}
