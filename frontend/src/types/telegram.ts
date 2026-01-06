export interface TelegramIntegration {
  id: string
  type: string
  name: string
  is_active: boolean
  created_at: string
  updated_at?: string
  has_chat_id?: boolean
}

export interface CreateTelegramIntegrationParams {
  name: string
  bot_token: string
  chat_id?: string
  is_active?: boolean
}

export interface UpdateTelegramIntegrationParams {
  name?: string
  bot_token?: string
  chat_id?: string
  is_active?: boolean
}

export interface BotInfo {
  id: number
  first_name: string
  username: string
  can_join_groups: boolean
  can_read_all_group_messages: boolean
}

export interface WebhookInfo {
  url?: string
  has_custom_certificate: boolean
  pending_update_count: number
  last_error_date?: string
  last_error_message?: string
}

export interface SendMessageParams {
  chat_id: string
  text: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disable_web_page_preview?: boolean
  disable_notification?: boolean
  reply_to_message_id?: number
}

export interface SendPhotoParams {
  chat_id: string
  photo: string
  caption?: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disable_notification?: boolean
}

export interface SendDocumentParams {
  chat_id: string
  document: string
  caption?: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disable_notification?: boolean
}

export interface MessageResponse {
  message_id: number
  chat_id: number
  text?: string
  date: string
}

export interface TestConnectionResponse {
  connected: boolean
  message: string
}

export interface SetWebhookParams {
  url: string
  max_connections?: number
  allowed_updates?: string[]
}

export interface ChatInfo {
  id: number
  type: string
  title?: string
  username?: string
  first_name?: string
  last_name?: string
}

