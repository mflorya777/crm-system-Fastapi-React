export interface TelephonyIntegration {
  id: string
  name: string
  is_active: boolean
  config: {
    api_key?: string
    api_salt?: string
    vpbx_api_key?: string
    vpbx_api_salt?: string
  }
  created_at: string
  updated_at?: string
}

export interface CallInfo {
  entry_id?: string
  from_number?: string
  to_number?: string
  start_time?: number
  duration?: number
  status?: string
  direction?: 'incoming' | 'outgoing'
}

export interface CallHistoryResponse {
  calls: CallInfo[]
  total: number
}

export interface CallStatistic {
  total_calls: number
  successful_calls: number
  failed_calls: number
}

export interface MakeCallParams {
  from_number: string
  to_number: string
  line_number?: string
}

export interface CallHistoryParams {
  date_from?: number
  date_to?: number
  from_number?: string
  to_number?: string
  limit?: number
}

export interface StatisticsParams {
  date_from: number
  date_to: number
}

export interface CreateMangoOfficeIntegrationParams {
  name: string
  api_key: string
  api_salt: string
  vpbx_api_key: string
  vpbx_api_salt: string
  is_active?: boolean
}

export interface UpdateMangoOfficeIntegrationParams {
  name?: string
  api_key?: string
  api_salt?: string
  vpbx_api_key?: string
  vpbx_api_salt?: string
  is_active?: boolean
}

export interface IncomingCallEvent {
  call_id: string
  from_number: string
  to_number: string
  timestamp: number
}

export interface CallStatusEvent {
  call_id: string
  status: 'ringing' | 'answered' | 'ended' | 'failed'
  duration?: number
}

