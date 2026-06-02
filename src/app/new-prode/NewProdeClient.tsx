'use client'
import React from 'react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { DesktopHeader, MobileHeader } from '@/components/common/Header'
import { Layout, Footer, Container, Card, CardContent } from '@/layout'
import { Button } from '@/components/common/Button'
import {
  Form,
  FormInput,
  FormSection,
  FormSectionTitle,
  FormFooter,
  FormSectionContent,
} from '@/components/common/Form'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { FormError } from '@/components/common/Form/FormError'
import { formError } from '@/utils/errors'
import { User } from '@/generated/prisma'
import { LocaleSelect } from '@/components/common/LocaleSelect'
import { useLocalizedText } from '@/locale'

interface NewProdeClientProps {
  userRanking?: Pick<
    User,
    'id' | 'name' | 'image' | 'email' | 'prodePublic' | 'background' | 'dark'
  >
  registeredProdes: number
}

type FormType = {
  name: string
  password: string
  public: boolean
  pointsWinner: number
  pointsGoals: number
  pointsPenal: number
  emailDomain: string
}

export default function NewProdeClient(props: NewProdeClientProps) {
  const router = useRouter()
  const i18n = useLocalizedText()

  const [error, setError] = React.useState<string>('')
  const [roomNameError, setRoomNameError] = React.useState<boolean | undefined>(undefined)
  const [form, setForm] = React.useState<FormType>({
    name: '',
    password: '',
    public: true,
    pointsWinner: 1,
    pointsGoals: 3,
    pointsPenal: 5,
    emailDomain: '',
  })

  const checkRoomName = React.useMemo(() => {
    let timeout: NodeJS.Timeout
    return (name: string) => {
      setRoomNameError(undefined)
      clearTimeout(timeout)
      if (name) {
        timeout = setTimeout(() => {
          axios.get(`/api/check-room-name?name=${name}`).then((response) => {
            const allowed = response.data.allowed as boolean
            setRoomNameError(!allowed)
          })
        }, 250)
      }
    }
  }, [])

  const handleChange = React.useCallback(
    (key: keyof FormType) => {
      return (value: FormType[keyof FormType]) => {
        if (key === 'name') checkRoomName(value as FormType['name'])
        setForm((form) => ({ ...form, [key]: value }))
      }
    },
    [checkRoomName]
  )

  const handleCreate = React.useCallback(() => {
    axios
      .post('/api/create', form)
      .then((response) => {
        const { id } = response.data
        if (id) {
          router.push(`/${id}/ranking`)
        }
      })
      .catch((error) => {
        if (error.response.data.error) {
          setError(error.response.data.error)
        } else {
          setError('')
        }
      })
  }, [form, router])

  return (
    <Layout backgroundImage={`/${props.userRanking?.background}.png`}>
      <DesktopHeader userRanking={props.userRanking}>
        {props.registeredProdes <= 1 && (
          <Button invert href="/">
            {i18n.buttonLabelGroupPhase}
          </Button>
        )}
        <Button invert href="/rooms">
          {i18n.buttonLabelGoBackToList}
        </Button>
      </DesktopHeader>
      <MobileHeader userRanking={props.userRanking} />
      <Container>
        <Card title={i18n.createTitle}>
          <CardContent>
            <Form>
              <FormSection>
                <FormSectionTitle>{i18n.createGeneralTitle}</FormSectionTitle>
                <FormSectionContent>
                  <FormInput
                    label={i18n.createNameLabel}
                    type="string"
                    inline
                    value={form.name}
                    onChange={handleChange('name')}
                    error={roomNameError ? 'Name already taken' : ''}
                  />
                  <FormInput
                    label={i18n.createPasswordLabel}
                    legend={i18n.createPasswordLegend}
                    type="string"
                    inline
                    value={form.password}
                    onChange={handleChange('password')}
                  />
                  <FormInput
                    label={i18n.createDomainLabel}
                    legend={i18n.createDomainLegend}
                    type="string"
                    inline
                    placeholder="(ex: @leniolabs.com)"
                    value={form.emailDomain}
                    onChange={handleChange('emailDomain')}
                  />
                  <FormInput
                    label={i18n.createPublicLabel}
                    legend={i18n.createPublicLegend}
                    type="boolean"
                    inline
                    value={form.public}
                    onChange={handleChange('public')}
                  />
                </FormSectionContent>
              </FormSection>
              <FormSection>
                <FormSectionTitle>{i18n.createPointsTitle}</FormSectionTitle>
                <FormSectionContent>
                  <FormInput
                    label={i18n.createPointsResultLabel}
                    legend={i18n.createPointsResultLegend}
                    type="number"
                    inline
                    value={form.pointsWinner}
                    onChange={handleChange('pointsWinner')}
                  />
                  <FormInput
                    label={i18n.createPointsGoalsLabel}
                    legend={i18n.createPointsGoalsLegend}
                    type="number"
                    inline
                    value={form.pointsGoals}
                    onChange={handleChange('pointsGoals')}
                  />
                  <FormInput
                    label={i18n.createPointsPenaltisLabel}
                    legend={i18n.createPointsPenaltisLegend}
                    type="number"
                    inline
                    value={form.pointsPenal}
                    onChange={handleChange('pointsPenal')}
                  />
                </FormSectionContent>
              </FormSection>
              <FormFooter>
                {error && <FormError>{formError(error)}</FormError>}
                <Button onClick={handleCreate}>{i18n.buttonLabelCreate}</Button>
              </FormFooter>
            </Form>
          </CardContent>
        </Card>
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  )
}
