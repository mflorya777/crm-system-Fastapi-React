'use client'

import React, { useState } from 'react'
import { Container, Tabs, Tab } from 'react-bootstrap'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import ZoomSettings from './components/ZoomSettings'
import MeetingsList from './components/MeetingsList'
import type { ZoomMeeting } from '@/types/zoom'

const ZoomPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('settings')
  const [selectedMeeting, setSelectedMeeting] = useState<ZoomMeeting | null>(null)

  const handleMeetingClick = (meeting: ZoomMeeting) => {
    setSelectedMeeting(meeting)
    // Можно открыть модальное окно с деталями встречи
    console.log('Selected meeting:', meeting)
  }

  return (
    <>
      <PageBreadcrumb title="Zoom" subName="Интеграции" />
      <Container fluid>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="settings" title="Настройки">
            <div className="mt-3">
              <ZoomSettings />
            </div>
          </Tab>
          <Tab eventKey="meetings" title="Встречи">
            <div className="mt-3">
              <MeetingsList onMeetingClick={handleMeetingClick} />
            </div>
          </Tab>
        </Tabs>
      </Container>
    </>
  )
}

export default ZoomPage

