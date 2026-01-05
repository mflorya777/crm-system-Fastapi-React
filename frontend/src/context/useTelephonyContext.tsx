'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { TelephonyIntegration, CallInfo, IncomingCallEvent, CallStatusEvent } from '@/types/telephony'
import { useTelephonyIntegration } from '@/hooks/useTelephonyIntegration'
import { useCallHistory } from '@/hooks/useCallHistory'

interface TelephonyContextType {
  // Интеграция
  integration: TelephonyIntegration | null
  loading: boolean
  refreshIntegration: () => Promise<void>
  
  // История звонков
  calls: CallInfo[]
  refreshCalls: () => Promise<void>
  
  // Входящие звонки
  incomingCall: IncomingCallEvent | null
  setIncomingCall: (call: IncomingCallEvent | null) => void
  
  // Статус звонка
  activeCallStatus: CallStatusEvent | null
  setActiveCallStatus: (status: CallStatusEvent | null) => void
}

const TelephonyContext = createContext<TelephonyContextType | undefined>(undefined)

export const useTelephonyContext = () => {
  const context = useContext(TelephonyContext)
  if (!context) {
    throw new Error('useTelephonyContext must be used within TelephonyProvider')
  }
  return context
}

interface TelephonyProviderProps {
  children: ReactNode
}

export const TelephonyProvider: React.FC<TelephonyProviderProps> = ({ children }) => {
  const [integration, setIntegration] = useState<TelephonyIntegration | null>(null)
  const [incomingCall, setIncomingCall] = useState<IncomingCallEvent | null>(null)
  const [activeCallStatus, setActiveCallStatus] = useState<CallStatusEvent | null>(null)
  
  const { getIntegrations, loading: integrationLoading } = useTelephonyIntegration()
  const { calls, fetchCallHistory, loading: callsLoading } = useCallHistory(undefined, false)

  const refreshIntegration = useCallback(async () => {
    const integrations = await getIntegrations()
    const activeIntegration = integrations.find((i) => i.is_active) || integrations[0] || null
    setIntegration(activeIntegration)
  }, [getIntegrations])

  const refreshCalls = useCallback(async () => {
    await fetchCallHistory()
  }, [fetchCallHistory])

  useEffect(() => {
    refreshIntegration()
  }, [refreshIntegration])

  const value: TelephonyContextType = {
    integration,
    loading: integrationLoading || callsLoading,
    refreshIntegration,
    calls,
    refreshCalls,
    incomingCall,
    setIncomingCall,
    activeCallStatus,
    setActiveCallStatus,
  }

  return <TelephonyContext.Provider value={value}>{children}</TelephonyContext.Provider>
}

