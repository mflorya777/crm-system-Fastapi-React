import type { ScheduleType, StatisticType, StatType } from './types'

export const stateData: StatType[] = [
  {
    icon: 'iconamoon:3d-duotone',
    iconColor: 'info',
    amount: '59.6',
    title: 'Общие продажи',
    change: '8.72',
    changeColor: 'success',
    badgeIcon: 'bx:doughnut-chart',
  },
  {
    icon: 'iconamoon:category-duotone',
    iconColor: 'success',
    amount: '24.03',
    title: 'Общие расходы',
    change: '3.28',
    changeColor: 'danger',
    badgeIcon: 'bx:bar-chart-alt-2',
  },
  {
    icon: 'iconamoon:store-duotone',
    iconColor: 'purple',
    amount: '48.7',
    title: 'Инвестиции',
    change: '5.69',
    changeColor: 'danger',
    badgeIcon: 'bx:building-house',
  },
  {
    icon: 'iconamoon:gift-duotone',
    iconColor: 'orange',
    amount: '11.3',
    title: 'Прибыль',
    change: '10.58',
    changeColor: 'success',
    badgeIcon: 'bx:bowl-hot',
  },
  {
    icon: 'iconamoon:certificate-badge-duotone',
    iconColor: 'warning',
    amount: '5.5',
    title: 'Сбережения',
    change: '8.72',
    changeColor: 'success',
    badgeIcon: 'bx:cricket-ball',
  },
]

export const scheduleData: ScheduleType[] = [
  {
    time: '09:00',
    title: 'Настройка репозитория Github',
    variant: 'primary',
    duration: '09:00 - 10:00',
  },
  {
    time: '10:00',
    title: 'Обзор дизайна - Reback Admin',
    variant: 'success',
    duration: '10:00 - 10:30',
  },
  {
    time: '11:00',
    title: 'Встреча с командой BD',
    variant: 'info',
    duration: '11:00 - 12:30',
  },
  {
    time: '01:00',
    title: 'Встреча со студией дизайна',
    variant: 'warning',
    duration: '01:00 - 02:00',
  },
]

export const statisticData: StatisticType[] = [
  {
    icon: 'bx:layer',
    iconColor: 'primary',
    title: 'Отправлено кампаний',
    amount: '13, 647',
    change: '2.3',
    changeColor: 'success',
  },
  {
    icon: 'bx:award',
    iconColor: 'success',
    title: 'Новые лиды',
    amount: '9, 526',
    change: '8.1',
    changeColor: 'success',
  },
  {
    icon: 'bxs:backpack',
    iconColor: 'danger',
    title: 'Сделки',
    amount: '976',
    change: '0.3',
    changeColor: 'danger',
  },
  {
    icon: 'bx:dollar-circle',
    iconColor: 'warning',
    title: 'Забронированный доход',
    amount: '$123',
    change: '10.6',
    changeColor: 'danger',
  },
]
