'use client'

import React, { useState } from 'react'
import { Container, Tabs, Tab } from 'react-bootstrap'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import TelephonySettings from './components/TelephonySettings'
import CallHistory from './components/CallHistory'
import CallStatistics from './components/CallStatistics'
import CallWidget from './components/CallWidget'
import IncomingCallModal from '@/components/telephony/IncomingCallModal'
import { useTelephonyContext } from '@/context/useTelephonyContext'
import { useAuthContext } from '@/context/useAuthContext'
import { useTelephonyWebSocket } from '@/hooks/useTelephonyWebSocket'
import type { IncomingCallEvent, CallStatusEvent } from '@/types/telephony'

const TelephonyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('settings')
  const { setIncomingCall, setActiveCallStatus, refreshCalls } = useTelephonyContext()
  const [incomingCall, setLocalIncomingCall] = useState<IncomingCallEvent | null>(null)

  const { user } = useAuthContext()
  
  // WebSocket для реального времени
  useTelephonyWebSocket({
    enabled: !!user?.id,
    onIncomingCall: (event: IncomingCallEvent) => {
      setIncomingCall(event)
      setLocalIncomingCall(event)
    },
    onCallStatusChanged: (event: CallStatusEvent) => {
      setActiveCallStatus(event)
    },
    onNewCallRecord: () => {
      refreshCalls()
    },
  })

  const handleAnswerCall = () => {
    // Логика ответа на звонок
    console.log('Answering call:', incomingCall)
    setLocalIncomingCall(null)
    setIncomingCall(null)
  }

  const handleRejectCall = () => {
    // Логика отклонения звонка
    console.log('Rejecting call:', incomingCall)
    setLocalIncomingCall(null)
    setIncomingCall(null)
  }

  return (
    <>
      <PageBreadcrumb title="Телефония" subName="Интеграции" />
      
      <Container fluid>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'settings')}
          className="mb-3"
        >
          <Tab eventKey="settings" title="Настройки">
            <div className="mt-3">
              <TelephonySettings
                onIntegrationUpdated={() => {
                  // Можно обновить данные после изменения интеграции
                }}
              />
            </div>
          </Tab>
          
          <Tab eventKey="history" title="История звонков">
            <div className="mt-3">
              <CallHistory
                onCallClick={(call) => {
                  console.log('Call clicked:', call)
                  // Можно открыть детали звонка
                }}
              />
            </div>
          </Tab>
          
          <Tab eventKey="statistics" title="Статистика">
            <div className="mt-3">
              <CallStatistics />
            </div>
          </Tab>
        </Tabs>
      </Container>

      {/* Плавающий виджет для звонков */}
      <CallWidget />

      {/* Модальное окно входящего звонка */}
      <IncomingCallModal
        show={!!incomingCall}
        call={incomingCall}
        onAnswer={handleAnswerCall}
        onReject={handleRejectCall}
        onClose={() => {
          setLocalIncomingCall(null)
          setIncomingCall(null)
        }}
      />
    </>
  )
}

export default TelephonyPage

