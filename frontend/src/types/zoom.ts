export interface ZoomIntegration {
  id: string
  type: string
  name: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface CreateZoomIntegrationParams {
  name: string
  account_id: string
  client_id: string
  client_secret: string
  is_active?: boolean
}

export interface UpdateZoomIntegrationParams {
  name?: string
  account_id?: string
  client_id?: string
  client_secret?: string
  is_active?: boolean
}

export interface ZoomMeeting {
  id: string
  uuid: string
  host_id: string
  topic: string
  type: number // 1=мгновенная, 2=запланированная, 3=повторяющаяся, 8=фиксированное время
  start_time?: string
  duration: number
  timezone?: string
  created_at?: string
  join_url: string
  start_url?: string
  password?: string
  agenda?: string
  settings?: {
    host_video?: boolean
    participant_video?: boolean
    join_before_host?: boolean
    mute_upon_entry?: boolean
    waiting_room?: boolean
    auto_recording?: string
  }
  status?: string
}

export interface ZoomParticipant {
  id?: string
  user_id?: string
  name: string
  user_email?: string
  join_time?: string
  leave_time?: string
  duration?: number
}

export interface ZoomRecording {
  id: string
  meeting_id: string
  recording_start?: string
  recording_end?: string
  file_type: string
  file_size?: number
  play_url?: string
  download_url?: string
  status?: string
}

export interface CreateMeetingParams {
  topic: string
  type?: number
  start_time?: string // ISO 8601 format
  duration?: number
  timezone?: string
  password?: string
  agenda?: string
  host_video?: boolean
  participant_video?: boolean
  join_before_host?: boolean
  mute_upon_entry?: boolean
  waiting_room?: boolean
  auto_recording?: string
  user_id?: string
}

export interface UpdateMeetingParams {
  topic?: string
  type?: number
  start_time?: string
  duration?: number
  timezone?: string
  password?: string
  agenda?: string
  host_video?: boolean
  participant_video?: boolean
  join_before_host?: boolean
  mute_upon_entry?: boolean
  waiting_room?: boolean
  auto_recording?: string
}

export interface MeetingListParams {
  user_id?: string
  type?: 'live' | 'scheduled' | 'upcoming' | 'previous'
  page_size?: number
  next_page_token?: string
}

export interface MeetingListResponse {
  meetings: ZoomMeeting[]
  page_size: number
  next_page_token?: string
  total_records?: number
}

export interface ParticipantListResponse {
  participants: ZoomParticipant[]
  page_count: number
  page_size: number
  total_records: number
  next_page_token?: string
}

export interface RecordingListResponse {
  recordings: ZoomRecording[]
  page_size: number
  next_page_token?: string
  total_records?: number
}

