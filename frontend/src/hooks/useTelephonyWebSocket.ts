import { useEffect, useRef, useCallback } from 'react'
import { useAuthContext } from '@/context/useAuthContext'
import type { IncomingCallEvent, CallStatusEvent } from '@/types/telephony'

interface UseTelephonyWebSocketOptions {
  enabled?: boolean
  onIncomingCall?: (event: IncomingCallEvent) => void
  onCallStatusChanged?: (event: CallStatusEvent) => void
  onNewCallRecord?: (callId: string) => void
}

export const useTelephonyWebSocket = (options: UseTelephonyWebSocketOptions = {}) => {
  const {
    enabled = true,
    onIncomingCall,
    onCallStatusChanged,
    onNewCallRecord,
  } = options

  const { user } = useAuthContext()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!enabled) return

    const userId = user?.id || ''
    if (!userId) {
      console.warn('[Telephony WebSocket] No user ID found')
      return
    }

    const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8081'
    const wsEndpoint = `${wsUrl}/integrations/telephony/ws?user_id=${userId}`

    try {
      const ws = new WebSocket(wsEndpoint)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[Telephony WebSocket] Connected')
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'incoming_call':
              if (onIncomingCall) {
                onIncomingCall(data.payload as IncomingCallEvent)
              }
              break
              
            case 'call_status_changed':
              if (onCallStatusChanged) {
                onCallStatusChanged(data.payload as CallStatusEvent)
              }
              break
              
            case 'new_call_record':
              if (onNewCallRecord) {
                onNewCallRecord(data.payload.call_id)
              }
              break
              
            default:
              console.log('[Telephony WebSocket] Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('[Telephony WebSocket] Error parsing message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[Telephony WebSocket] Error:', error)
      }

      ws.onclose = () => {
        console.log('[Telephony WebSocket] Disconnected')
        wsRef.current = null

        // Попытка переподключения
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`[Telephony WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          console.error('[Telephony WebSocket] Max reconnection attempts reached')
        }
      }
    } catch (error) {
      console.error('[Telephony WebSocket] Connection error:', error)
    }
  }, [enabled, onIncomingCall, onCallStatusChanged, onNewCallRecord])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, user?.id, connect, disconnect])

  return {
    connected: wsRef.current?.readyState === WebSocket.OPEN,
    connect,
    disconnect,
  }
}

