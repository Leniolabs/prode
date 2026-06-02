'use client'
import React from 'react'
import { Stage } from '@/generated/prisma'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Button } from '@/components/common/Button'
import { HeaderMessage, LeniBall, HeaderMenu } from '@/components/common/Header'
import { Layout, Footer, Header, Container, ContainerHeader } from '@/layout'
import axios from 'axios'
import commonStyles from '@/styles/CommonStyles.module.scss'
import { getAdminFinalsMatchLooser, getAdminFinalsMatchWinner } from '@/utils/points'
import { MatchFinalsInput } from '@/components/common/MatchFinalsInput'
import {
  BracketIcon,
  BracketsContainer,
  BracketTitle,
  FinalsContainer,
  bracketOffsetQuarter,
} from '@/components/view/Finals'
import { className } from '@/utils/classname'
import { LocaleSelect } from '@/components/common/LocaleSelect'
import { useLocalizedText } from '@/locale'

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
  countryRightId?: string | null
}

interface AdminFinalsClientProps {
  matches: UIMatch[]
}

const getMatchOrder = (matchStage: Stage) => {
  switch (matchStage) {
    case 'FINALS_8_1': return 1; case 'FINALS_8_2': return 7; case 'FINALS_8_3': return 5; case 'FINALS_8_4': return 3;
    case 'FINALS_8_5': return 2; case 'FINALS_8_6': return 4; case 'FINALS_8_7': return 6; case 'FINALS_8_8': return 8;
    case 'FINALS_4_1': return 10; case 'FINALS_4_3': return 11; case 'FINALS_4_2': return 12; case 'FINALS_4_4': return 13;
    case 'FINALS_2_1': return 15; case 'FINALS_2_2': return 16; case 'FINALS': return 18; case 'THIRD_PLACE': return 19;
    default: return 0
  }
}

export default function AdminFinalsClient(props: AdminFinalsClientProps) {
  const i18n = useLocalizedText()

  const [updating, setUpdating] = React.useState(false)
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>(props.matches || [])
  const [matches, setMatches] = React.useState<UIMatch[]>(props.matches)

  const computedMatches = React.useMemo(() => {
    const nn = (m: UIMatch) => ({ ...m, countryLeftId: m.countryLeftId ?? undefined, countryRightId: m.countryRightId ?? undefined })
    return matches.reduce((result, match) => {
      const get = (stage: string) => nn(result.find((row) => row.stage === stage) as UIMatch)
      if (match.stage === 'FINALS_4_1') return [...result, { ...match, countryLeftId: getAdminFinalsMatchWinner(get('FINALS_8_1')), countryRightId: getAdminFinalsMatchWinner(get('FINALS_8_3')) }]
      if (match.stage === 'FINALS_4_2') return [...result, { ...match, countryLeftId: getAdminFinalsMatchWinner(get('FINALS_8_2')), countryRightId: getAdminFinalsMatchWinner(get('FINALS_8_4')) }]
      if (match.stage === 'FINALS_4_3') return [...result, { ...match, countryLeftId: getAdminFinalsMatchWinner(get('FINALS_8_5')), countryRightId: getAdminFinalsMatchWinner(get('FINALS_8_7')) }]
      if (match.stage === 'FINALS_4_4') return [...result, { ...match, countryLeftId: getAdminFinalsMatchWinner(get('FINALS_8_6')), countryRightId: getAdminFinalsMatchWinner(get('FINALS_8_8')) }]
      if (match.stage === 'FINALS_2_1') return [...result, { ...match, countryLeftId: getAdminFinalsMatchWinner(get('FINALS_4_1')), countryRightId: getAdminFinalsMatchWinner(get('FINALS_4_3')) }]
      if (match.stage === 'FINALS_2_2') return [...result, { ...match, countryLeftId: getAdminFinalsMatchWinner(get('FINALS_4_2')), countryRightId: getAdminFinalsMatchWinner(get('FINALS_4_4')) }]
      if (match.stage === 'FINALS') return [...result, { ...match, countryLeftId: getAdminFinalsMatchWinner(get('FINALS_2_1')), countryRightId: getAdminFinalsMatchWinner(get('FINALS_2_2')) }]
      if (match.stage === 'THIRD_PLACE') return [...result, { ...match, countryLeftId: getAdminFinalsMatchLooser(get('FINALS_2_1')), countryRightId: getAdminFinalsMatchLooser(get('FINALS_2_2')) }]
      return [...result, match]
    }, [] as UIMatch[])
  }, [matches])

  const handleMatchChange = React.useCallback(
    (id: string) => (value: { countryLeftId?: string; goalsLeft: number | null; countryRightId?: string; goalsRight: number | null; penaltisLeft?: number | null; penaltisRight?: number | null }) => {
      setMatches(computedMatches.map((match) => match.id === id ? { ...match, countryLeftId: value.countryLeftId, goalsLeft: value.goalsLeft, countryRightId: value.countryRightId, goalsRight: value.goalsRight, penaltisLeft: value.penaltisLeft ?? null, penaltisRight: value.penaltisRight ?? null } : match))
    },
    [computedMatches]
  )

  const differentMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const o = originalMatches.find((m) => m.id === match.id)
      if (!o) return false
      return o.countryLeftId !== match.countryLeftId || o.countryRightId !== match.countryRightId || o.goalsLeft !== match.goalsLeft || o.goalsRight !== match.goalsRight || o.penaltisLeft !== match.penaltisLeft || o.penaltisRight !== match.penaltisRight
    })
  }, [originalMatches, matches])

  const isModified = React.useMemo(() => !!differentMatches.length, [originalMatches, matches])

  const handleSave = React.useCallback(() => {
    setUpdating(true)
    axios.post('/api/admin/finals', {
      matches: differentMatches.map((match) => ({ id: match.id, countryLeftId: match.countryLeftId, countryRightId: match.countryRightId, goalsLeft: match.goalsLeft ?? null, goalsRight: match.goalsRight ?? null, penaltisLeft: match.penaltisLeft ?? null, penaltisRight: match.penaltisRight ?? null })).filter((match) => match.countryLeftId && match.countryRightId),
    }).then(() => { setOriginalMatches(matches); setUpdating(false) })
  }, [differentMatches, matches])

  const handleStartFinals = React.useCallback(() => {
    axios.post('/api/admin/finals-start').then(() => {})
  }, [])

  return (
    <Layout>
      <Header>
        <HeaderMessage title={i18n.headerTitle} subtitle={<>{i18n.headerWelcomeLine}<br />{i18n.headerWelcomeLine1}<br /><span>{i18n.headerWelcomeLine2}</span>.</>} />
        <Button onClick={handleStartFinals}>Start Finals</Button>
        <LeniBall />
        <HeaderMenu />
      </Header>
      <Container full>
        <FinalsContainer full admin>
          <ContainerHeader sticky title={i18n.finalsTitle} gridArea="matches-header">
            <Button disabled={!isModified} className={commonStyles.marginLeftAuto} onClick={handleSave}>{i18n.buttonLabelSave}</Button>
          </ContainerHeader>
          <BracketsContainer gridArea="matches">
            <BracketTitle full order={0}>{i18n.FINALS_8}</BracketTitle>
            {computedMatches.filter(x=>x.stage.includes('FINALS_8_')).sort((a,b)=>a.stage>b.stage?1:-1).map(match=>(
              <MatchFinalsInput key={match.id} date={new Date(match.date)} countryLeftId={match.countryLeftId ?? undefined} goalsLeft={match.goalsLeft??undefined} countryRightId={match.countryRightId ?? undefined} goalsRight={match.goalsRight??undefined} penaltisLeft={match.penaltisLeft??null} penaltisRight={match.penaltisRight??null} onChange={handleMatchChange(match.id)} countryInput order={getMatchOrder(match.stage)} />
            ))}
            <BracketIcon order={9}/><BracketIcon order={9}/><BracketIcon order={9}/><BracketIcon order={9}/>
            <BracketTitle order={9} full>{i18n.FINALS_4}</BracketTitle>
            {computedMatches.filter(x=>x.stage.includes('FINALS_4_')).sort((a,b)=>a.stage>b.stage?1:-1).map(match=>(
              <MatchFinalsInput key={match.id} date={new Date(match.date)} countryLeftId={match.countryLeftId ?? undefined} goalsLeft={match.goalsLeft??undefined} countryRightId={match.countryRightId ?? undefined} goalsRight={match.goalsRight??undefined} penaltisLeft={match.penaltisLeft??null} penaltisRight={match.penaltisRight??null} onChange={handleMatchChange(match.id)} countryInput order={getMatchOrder(match.stage)} />
            ))}
            <BracketIcon order={14} big/><BracketIcon order={14} big/>
            <BracketTitle className={bracketOffsetQuarter} order={14} full>{i18n.FINALS_2}</BracketTitle>
            {computedMatches.filter(x=>x.stage.includes('FINALS_2_')).sort((a,b)=>a.stage>b.stage?1:-1).map((match,index)=>(
              <MatchFinalsInput key={match.id} className={className(index===0&&bracketOffsetQuarter)} date={new Date(match.date)} countryLeftId={match.countryLeftId ?? undefined} goalsLeft={match.goalsLeft??undefined} countryRightId={match.countryRightId ?? undefined} goalsRight={match.goalsRight??undefined} penaltisLeft={match.penaltisLeft??null} penaltisRight={match.penaltisRight??null} onChange={handleMatchChange(match.id)} countryInput order={getMatchOrder(match.stage)} />
            ))}
            <BracketIcon className={className(bracketOffsetQuarter)} order={17} big/>
            <BracketTitle className={className(bracketOffsetQuarter)} order={17}>{i18n.FINAL}</BracketTitle>
            <BracketTitle order={17}>{i18n.THIRD_PLACE}</BracketTitle>
            {computedMatches.filter(x=>x.stage==='FINALS'||x.stage==='THIRD_PLACE').sort((a,b)=>a.stage>b.stage?1:-1).map((match,index)=>(
              <MatchFinalsInput className={className(index===0&&bracketOffsetQuarter)} key={match.id} date={new Date(match.date)} countryLeftId={match.countryLeftId ?? undefined} goalsLeft={match.goalsLeft??undefined} countryRightId={match.countryRightId ?? undefined} goalsRight={match.goalsRight??undefined} penaltisLeft={match.penaltisLeft??null} penaltisRight={match.penaltisRight??null} onChange={handleMatchChange(match.id)} countryInput order={getMatchOrder(match.stage)} />
            ))}
          </BracketsContainer>
        </FinalsContainer>
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  )
}
