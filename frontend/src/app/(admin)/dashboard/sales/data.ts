import type { AccountType, StatType, TransactionType } from './types'

import avatar2 from '@/assets/images/users/avatar-2.jpg'
import avatar3 from '@/assets/images/users/avatar-3.jpg'
import avatar4 from '@/assets/images/users/avatar-4.jpg'
import avatar5 from '@/assets/images/users/avatar-5.jpg'
import avatar6 from '@/assets/images/users/avatar-6.jpg'

export const stateData: StatType[] = [
  {
    icon: 'iconamoon:shopping-card-add-duotone',
    iconColor: 'info',
    amount: '59.6',
    title: 'Общие продажи',
    change: '8.72',
    changeColor: 'success',
    badgeIcon: 'bx:doughnut-chart',
  },
  {
    icon: 'iconamoon:link-external-duotone',
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
    amount: '5.06',
    title: 'Накопления',
    change: '8.72',
    changeColor: 'success',
    badgeIcon: 'bx:cricket-ball',
  },
]

export const accountData: AccountType[] = [
  {
    id: '#US523',
    date: '24 April, 2024',
    user: {
      avatar: avatar2,
      name: 'Dan Adrick',
    },
    status: 'Подтверждён',
    username: '@omions',
  },
  {
    id: '#US652',
    date: '24 April, 2024',
    user: {
      avatar: avatar3,
      name: 'Daniel Olsen',
    },
    status: 'Подтверждён',
    username: '@alliates',
  },
  {
    id: '#US862',
    date: '20 April, 2024',
    user: {
      avatar: avatar4,
      name: 'Jack Roldan',
    },
    status: 'В ожидании',
    username: '@griys',
  },
  {
    id: '#US756',
    date: '18 April, 2024',
    user: {
      avatar: avatar5,
      name: 'Betty Cox',
    },
    status: 'Подтверждён',
    username: '@reffon',
  },
  {
    id: '#US420',
    date: '18 April, 2024',
    user: {
      avatar: avatar6,
      name: 'Carlos Johnson',
    },
    status: 'Заблокирован',
    username: '@bebo',
  },
]

export const transactionsData: TransactionType[] = [
  {
    id: '#98521',
    date: '24 April, 2024',
    amount: '120.55',
    status: 'Cr',
    description: 'Комиссии',
  },
  {
    id: '#20158',
    date: '24 April, 2024',
    amount: '9.68',
    status: 'Cr',
    description: 'Партнёры',
  },
  {
    id: '#36589',
    date: '20 April, 2024',
    amount: '105.22',
    status: 'Dr',
    description: 'Продукты',
  },
  {
    id: '#95362',
    date: '18 April, 2024',
    amount: '80.59',
    status: 'Cr',
    description: 'Возвраты',
  },
  {
    id: '#75214',
    date: '18 April, 2024',
    amount: '750.95',
    status: 'Dr',
    description: 'Оплата счетов',
  },
]
