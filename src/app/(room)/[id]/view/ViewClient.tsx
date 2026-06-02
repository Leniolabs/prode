'use client'
// Re-exports the original view page Home component with adjusted imports
import React from 'react'
import { Match, ProdeRoom, Stage, User } from '@/generated/prisma'
import { BrandLogo } from '@/components/common/BrandLogo'
import { DesktopHeader, MobileHeader } from '@/components/common/Header'
import { MatchInput } from '@/components/common/MatchInput'
import { Layout, Footer, Container, Card, ContainerHeader, CardContent } from '@/layout'
import { CardsContainer, GroupsContainer, LeniCard } from '@/components/view/Groups'
import { UserImage } from '@/components/common/UserImage'
import { ShareButton, ShareProdeStoryButton } from '@/components/common/ShareButton'
import { LocaleSelect } from '@/components/common/LocaleSelect'
import { useLocalizedText } from '@/locale'
import { UserMatchFinalsInput } from '@/components/common/UserMatchFinalsInput'
import { BracketsContainer, FinalsContainer, BracketIcon, BracketTitle, bracketOffsetQuarter, BracketsMobileContainer } from '@/components/view/Finals'
import { className } from '@/utils/classname'
import { Collapsable, CollapsableContainer } from '@/components/common/Collapsable'
import { getMatchOrder } from '../finals/RoomFinalsClient'

type UIMatch = {
  id: string
  stage: Stage
  date: string | Date
  filled: boolean
  goalsLeft: number | null
  goalsRight: number | null
  countryLeftId: string | null
  userGoalsLeft?: number | null
  countryRightId: string | null
  userGoalsRight?: number | null
  resultStatus?: string | null
}

type UIFinalMatch = {
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
  countryRightId?: string | null
  userCountryRightId?: string | null
  userGoalsRight?: number | null
  userPenaltisRight?: number | null
  resultStatus?: string | null
  countryStatus?: string | null
}

interface ViewClientProps {
  id: string
  name?: string
  userProdeId: string
  roomAdmin: boolean
  userInRoom: boolean
  room?: Pick<ProdeRoom, 'id' | 'name' | 'emailDomain' | 'password' | 'pointsGoals' | 'pointsPenal' | 'pointsWinner' | 'public'>
  finalsStarted: boolean
  userRanking?: Pick<User, 'id' | 'name' | 'image' | 'email' | 'prodePublic' | 'background' | 'dark'>
  viewUser: Pick<User, 'id' | 'name' | 'image'>
  matches?: UIMatch[]
  finalsMatches?: UIFinalMatch[]
}

export default function ViewClient(props: ViewClientProps) {
  const { matches, finalsMatches } = props
  const i18n = useLocalizedText()

  return (
    <Layout backgroundImage={`/${props.userRanking?.background}.png`}>
      {props.userRanking && (
        <DesktopHeader id={props.id} name={props.name} room={props.room} userRanking={props.userRanking} roomAdmin={props.roomAdmin} />
      )}
      {props.userRanking && (
        <MobileHeader list id={props.id} name={props.name} room={props.room} finalsStarted={props.finalsStarted} userRanking={props.userRanking} roomAdmin={props.roomAdmin} groups={props.userInRoom} finals={props.userInRoom} />
      )}
      <Container full>
        <GroupsContainer full admin>
          <ContainerHeader gridArea="matches-header" noMarginBottom noMarginTop={!props.userRanking} variant="SECONDARY"
            title={<><UserImage small image={props.viewUser.image} />{i18n.viewTitle}{props.viewUser.name}{i18n.viewTitleAfter}<ShareButton big marginLeftAuto userProdeId={props.userProdeId} /><ShareProdeStoryButton big marginLeftAuto userProdeId={props.userProdeId} /></>}
          />
        </GroupsContainer>
        <GroupsContainer full admin>
          <ContainerHeader gridArea="matches-header" sticky noMarginTop title={i18n.groupsTitle} />
          <CardsContainer gridArea="matches">
            {['GROUP_A','GROUP_B','GROUP_C','GROUP_D','GROUP_E','GROUP_F','GROUP_G','GROUP_H','GROUP_I','GROUP_J','GROUP_K','GROUP_L'].map((group) => (
              // @ts-ignore
              <Card key={group} title={i18n[group]}>
                <CardContent>
                  {(matches || []).filter((match) => match.stage === group).map((match) => (
                    <MatchInput key={match.id} disabled={true} date={new Date(match.date)} countryLeftId={match.countryLeftId ?? ''} goalsLeft={match.goalsLeft} countryRightId={match.countryRightId ?? ''} goalsRight={match.goalsRight} filled={match.filled} userGoalsLeft={match.userGoalsLeft} userGoalsRight={match.userGoalsRight} />
                  ))}
                </CardContent>
              </Card>
            ))}
            <LeniCard />
          </CardsContainer>
        </GroupsContainer>
        {props.finalsStarted && (
          <FinalsContainer full admin>
            <ContainerHeader gridArea="matches-header" noMarginTop noMarginBottom sticky title={i18n.finalsTitle} />
            <BracketsContainer gridArea="matches">
              <BracketTitle full order={0}>{i18n.FINALS_8}</BracketTitle>
              {(finalsMatches || []).filter(x => x.stage.includes('FINALS_8_')).sort((a,b) => a.stage > b.stage ? 1 : -1).map(match => (
                <UserMatchFinalsInput disabled={true} key={match.id} date={new Date(match.date)} userCountryLeftId={match.countryLeftId ?? undefined}userGoalsLeft={match.userGoalsLeft} userCountryRightId={match.countryRightId ?? undefined}userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight} goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId ?? undefined} countryRightId={match.countryRightId ?? undefined} order={getMatchOrder(match.stage)} filled={match.filled} />
              ))}
              <BracketIcon order={9} /><BracketIcon order={9} /><BracketIcon order={9} /><BracketIcon order={9} />
              <BracketTitle order={9} full>{i18n.FINALS_4}</BracketTitle>
              {(finalsMatches || []).filter(x => x.stage.includes('FINALS_4_')).sort((a,b) => a.stage > b.stage ? 1 : -1).map(match => (
                <UserMatchFinalsInput showCountryStatus disabled={true} key={match.id} date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId ?? undefined}userGoalsLeft={match.userGoalsLeft} userCountryRightId={match.userCountryRightId ?? undefined}userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight} goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId ?? undefined} countryRightId={match.countryRightId ?? undefined} order={getMatchOrder(match.stage)} filled={match.filled} />
              ))}
              <BracketIcon order={14} big /><BracketIcon order={14} big />
              <BracketTitle className={bracketOffsetQuarter} order={14} full>{i18n.FINALS_2}</BracketTitle>
              {(finalsMatches || []).filter(x => x.stage.includes('FINALS_2_')).sort((a,b) => a.stage > b.stage ? 1 : -1).map((match, index) => (
                <UserMatchFinalsInput showCountryStatus disabled={true} key={match.id} className={className(index === 0 && bracketOffsetQuarter)} date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId ?? undefined}userGoalsLeft={match.userGoalsLeft} userCountryRightId={match.userCountryRightId ?? undefined}userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight} goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId ?? undefined} countryRightId={match.countryRightId ?? undefined} order={getMatchOrder(match.stage)} filled={match.filled} />
              ))}
              <BracketIcon className={className(bracketOffsetQuarter)} order={17} big />
              <BracketTitle className={className(bracketOffsetQuarter)} order={17}>{i18n.FINAL}</BracketTitle>
              <BracketTitle order={17}>{i18n.THIRD_PLACE}</BracketTitle>
              {(finalsMatches || []).filter(x => x.stage === 'FINALS' || x.stage === 'THIRD_PLACE').sort((a,b) => a.stage > b.stage ? 1 : -1).map((match, index) => (
                <UserMatchFinalsInput showCountryStatus className={className(index === 0 && bracketOffsetQuarter)} disabled={true} key={match.id} date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId ?? undefined}userGoalsLeft={match.userGoalsLeft} userCountryRightId={match.userCountryRightId ?? undefined}userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight} goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId ?? undefined} countryRightId={match.countryRightId ?? undefined} order={getMatchOrder(match.stage)} filled={match.filled} />
              ))}
            </BracketsContainer>
            <BracketsMobileContainer gridArea="matches">
              <CollapsableContainer>
                <Collapsable title={i18n.FINALS_8}>{(finalsMatches || []).filter(x=>x.stage.includes('FINALS_8_')).sort((a,b)=>a.date>b.date?1:-1).map((match,i)=><UserMatchFinalsInput disabled={true} key={match.id} date={new Date(match.date)} userCountryLeftId={match.countryLeftId ?? undefined}userGoalsLeft={match.userGoalsLeft} userCountryRightId={match.countryRightId ?? undefined}userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight} goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId ?? undefined} countryRightId={match.countryRightId ?? undefined} order={i+1} filled={match.filled}/>)}</Collapsable>
                <Collapsable title={i18n.FINALS_4}>{(finalsMatches || []).filter(x=>x.stage.includes('FINALS_4_')).sort((a,b)=>a.date>b.date?1:-1).map((match,i)=><UserMatchFinalsInput showCountryStatus disabled={true} key={match.id} date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId ?? undefined}userGoalsLeft={match.userGoalsLeft} userCountryRightId={match.userCountryRightId ?? undefined}userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight} goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId ?? undefined} countryRightId={match.countryRightId ?? undefined} order={i+1+8} filled={match.filled}/>)}</Collapsable>
                <Collapsable title={i18n.FINALS_2}>{(finalsMatches || []).filter(x=>x.stage.includes('FINALS_2_')).sort((a,b)=>a.date>b.date?1:-1).map((match,i)=><UserMatchFinalsInput showCountryStatus disabled={true} key={match.id} date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId ?? undefined}userGoalsLeft={match.userGoalsLeft} userCountryRightId={match.userCountryRightId ?? undefined}userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight} goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId ?? undefined} countryRightId={match.countryRightId ?? undefined} order={i+1+8+4} filled={match.filled}/>)}</Collapsable>
                <Collapsable title={i18n.FINAL}>{(finalsMatches || []).filter(x=>x.stage==='FINALS'||x.stage==='THIRD_PLACE').sort((a,b)=>a.date>b.date?1:-1).map((match,i)=><UserMatchFinalsInput showCountryStatus disabled={true} key={match.id} date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId ?? undefined}userGoalsLeft={match.userGoalsLeft} userCountryRightId={match.userCountryRightId ?? undefined}userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight} goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId ?? undefined} countryRightId={match.countryRightId ?? undefined} order={i+1+8+4+2} filled={match.filled} highlight={match.stage==='FINALS'}/>)}</Collapsable>
              </CollapsableContainer>
            </BracketsMobileContainer>
          </FinalsContainer>
        )}
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  )
}
