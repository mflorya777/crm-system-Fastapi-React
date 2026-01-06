'use client'

import React, { useState } from 'react'
import { Container, Tabs, Tab } from 'react-bootstrap'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import TelegramSettings from './components/TelegramSettings'
import SendMessage from './components/SendMessage'
import BotInfo from './components/BotInfo'
import WebhookSettings from './components/WebhookSettings'

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

          <Tab eventKey="bot-info" title="Информация о боте">
            <div className="mt-3">
              <BotInfo />
            </div>
          </Tab>

          <Tab eventKey="send-message" title="Отправить сообщение">
            <div className="mt-3">
              <SendMessage />
            </div>
          </Tab>

          <Tab eventKey="webhook" title="Webhook">
            <div className="mt-3">
              <WebhookSettings />
            </div>
          </Tab>
        </Tabs>
      </Container>
    </>
  )
}

export default TelegramPage

