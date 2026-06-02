'use client'
import React from 'react'
import { ProdeRoom, User } from '@/generated/prisma'
import { BrandLogo } from '@/components/common/BrandLogo'
import { DesktopHeader } from '@/components/common/Header'
import { Layout, Footer, Container, Card, ContainerHeader, CardContent } from '@/layout'
import { Button } from '@/components/common/Button'
import { Table } from '@/components/common/Table'
import { CloseIcon } from '@/components/common/Icons'
import { ButtonIcon } from '@/components/common/ButtonIcon'
import axios from 'axios'
import { LocaleSelect } from '@/components/common/LocaleSelect'
import { HeaderIndicator } from '@/components/common/Header'
import { GroupsContainer } from '@/components/view/Groups'

interface AdminClientProps {
  rooms: (Pick<ProdeRoom, 'id' | 'name' | 'public' | 'password' | 'emailDomain'> & { playerCount: number })[]
  users: Pick<User, 'id' | 'email' | 'name' | 'blocked'>[]
  userCount: number
  roomCount: number
  prodeCount: number
}

export default function AdminClient(props: AdminClientProps) {
  const handleResetMatches = React.useCallback(() => {
    if (confirm('Are you sure')) {
      axios.post('/api/admin/reset').then(() => {})
    }
  }, [])

  const handlePruneDB = React.useCallback(() => {
    if (confirm('Are you sure')) {
      axios.post('/api/admin/prune').then(() => {})
    }
  }, [])

  const handleDeleteRoom = React.useCallback((id: string) => {
    return () => {
      if (confirm('Are you sure')) {
        axios.post(`/api/admin/rooms/${id}/delete`).then(() => {
          window.location.reload()
        })
      }
    }
  }, [])

  const handleBlockPlayer = React.useCallback((id: string) => {
    return () => {
      if (confirm('Are you sure')) {
        axios.post(`/api/admin/users/${id}/block`).then(() => {
          window.location.reload()
        })
      }
    }
  }, [])

  return (
    <Layout>
      <DesktopHeader>
        <HeaderIndicator text="Rooms" value={props.roomCount} />
        <HeaderIndicator text="Users" value={props.userCount} />
        <HeaderIndicator text="Prodes" value={props.prodeCount} />
      </DesktopHeader>
      <Container>
        <GroupsContainer full>
          <ContainerHeader sticky title="ADMIN DASHBOARD" />
        </GroupsContainer>
        <Button onClick={handleResetMatches}>RESET MATCHES</Button>
        <Button onClick={handlePruneDB}>PRUNE DB</Button>

        <Card title="LISTA DE PRODES">
          <CardContent>
            <Table
              stripped
              columns={[
                { header: 'Delete', accesor: (row) => <ButtonIcon onClick={handleDeleteRoom(row.id)}><CloseIcon /></ButtonIcon> },
                { header: 'Nombre', accesor: (row) => row.name },
                { header: 'Jugadores', accesor: (row) => row.playerCount, align: 'RIGHT', width: '80px', hideInMobile: true },
                { header: 'Public', accesor: (row) => (row.public ? 'SI' : 'NO'), align: 'RIGHT', width: '80px', hideInMobile: true },
                { header: 'Password', accesor: (row) => row.password, align: 'RIGHT', width: '80px', hideInMobile: true },
                { header: 'Email Domain', accesor: (row) => row.emailDomain, align: 'RIGHT', width: '80px', hideInMobile: true },
              ]}
              data={props.rooms || []}
            />
          </CardContent>
        </Card>

        <Card title="USERS">
          <CardContent>
            <Table
              stripped
              columns={[
                { header: 'Delete', accesor: (row) => <ButtonIcon onClick={handleBlockPlayer(row.id)}><CloseIcon /></ButtonIcon> },
                { header: 'Nombre', accesor: (row) => row.name },
                { header: 'Email', accesor: (row) => row.email, align: 'RIGHT' },
                { header: 'Bloqueado', accesor: (row) => (row.blocked ? 'SI' : 'NO'), align: 'RIGHT' },
              ]}
              data={props.users || []}
            />
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
