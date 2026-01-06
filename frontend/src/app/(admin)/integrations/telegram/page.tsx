'use client'

import React, { useState } from 'react'
import { Container, Tabs, Tab } from 'react-bootstrap'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import TelegramSettings from './components/TelegramSettings'

const TelegramPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('settings')

  return (
    <>
      <PageBreadcrumb title="Telegram" subName="Интеграции" />
      <Container fluid>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="settings" title="Настройки">
            <div className="mt-3">
              <TelegramSettings />
            </div>
          </Tab>
        </Tabs>
      </Container>
    </>
  )
}

export default TelegramPage

