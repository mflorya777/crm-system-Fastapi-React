import type { BootstrapVariantType } from '@/types/component-props'

type StockStatusType = {
  variant: BootstrapVariantType
  text: 'Ограничено' | 'Нет в наличии' | 'В наличии'
}

export const getStockStatus = (quantity: number) => {
  let stockStatus: StockStatusType = { variant: 'success', text: 'В наличии' }
  if (quantity < 1) stockStatus = { variant: 'danger', text: 'Нет в наличии' }
  else if (quantity < 11) stockStatus = { variant: 'primary', text: 'Ограничено' }
  return stockStatus
}

export const getRatingVariant = (rating: number) => {
  let ratingVariant: BootstrapVariantType = 'success'
  if (rating > 2 && rating < 4) ratingVariant = 'warning'
  else if (rating < 2) ratingVariant = 'danger'
  return ratingVariant
}

export const getOrderStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    Cancelled: 'Отменён',
    Processing: 'В обработке',
    Delivered: 'Доставлен',
    Pending: 'В ожидании',
    Success: 'Успешно',
    Failed: 'Ошибка',
    OnHold: 'Приостановлен',
  }
  return statusMap[status] || status
}

export const formatFileSize = (bytes: number, decimals: number = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const getActivityStatus = (status: 'typing' | 'online' | 'offline' | string) => {
  const statusMap: Record<string, string> = {
    typing: 'печатает',
    online: 'в сети',
    offline: 'не в сети',
  }
  return statusMap[status] || status
}

export const getTaskStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    Pending: 'В ожидании',
    'In-Progress': 'В процессе',
    Completed: 'Завершено',
  }
  return statusMap[status] || status
}

export const getTaskPriority = (priority: string) => {
  const priorityMap: Record<string, string> = {
    High: 'Высокий',
    Medium: 'Средний',
    Low: 'Низкий',
  }
  return priorityMap[priority] || priority
}

export const getThemeName = (theme: 'light' | 'dark' | string) => {
  const themeMap: Record<string, string> = {
    light: 'Светлая',
    dark: 'Тёмная',
  }
  return themeMap[theme] || theme
}

export const getActivityStreamStatus = (status: 'completed' | 'latest' | string) => {
  const statusMap: Record<string, string> = {
    completed: 'Завершено',
    latest: 'Последнее',
  }
  return statusMap[status] || status
}

export const getActivityStreamType = (type: 'task' | 'design' | 'achievement' | string) => {
  const typeMap: Record<string, string> = {
    task: 'Задача',
    design: 'Дизайн',
    achievement: 'Достижение',
  }
  return typeMap[type] || type
}
