import type { Employee, PricingType, ProjectType, TimelineType, TransactionType } from '@/types/data'

import avatar1 from '@/assets/images/users/avatar-1.jpg'
import avatar2 from '@/assets/images/users/avatar-2.jpg'
import avatar3 from '@/assets/images/users/avatar-3.jpg'
import avatar4 from '@/assets/images/users/avatar-4.jpg'
import avatar5 from '@/assets/images/users/avatar-5.jpg'
import avatar6 from '@/assets/images/users/avatar-6.jpg'
import avatar7 from '@/assets/images/users/avatar-7.jpg'

export const timelineData: TimelineType = {
  Сегодня: [
    {
      title: 'Завершен проект UX дизайна для нашего клиента',
      description: 'Провидение боли, вещи автоматически здесь почти место права времена похвалы ипса к долгам не?',
      important: true,
    },
    {
      title: 'Да! Мы празднуем наш первый релиз админки.',
      description: 'Совместная работа над элитой. Справедливо, опция, боль Джон деонпровиденс.',
    },
    {
      title: 'Мы выпустили новую версию нашей темы Reback.',
      description: '3 новые фотографии загружены на фан-страницу facebook',
    },
  ],
  Вчера: [
    {
      title: 'Мы достигли 25k продаж в наших темах',
      description: 'Провидение боли, вещи автоматически здесь почти место права времена похвалы ипса к долгам не?',
    },
    {
      title: 'Да! Мы празднуем наш первый релиз админки.',
      description: 'Выезд на открытом воздухе на шоссе Калифорнии 85 с Джоном Болтаной и Гарри Питерсоном.',
    },
  ],
  '5 дней назад': [
    {
      title: 'Присоединился новый член команды Алекс Смит',
      description:
        'Алекс Смит - старший инженер-программист (Full Stack) с глубокой страстью к созданию удобных, функциональных и красивых веб-приложений.',
    },
    {
      title: 'Первый релиз шаблона админ-панели Reback',
      description: 'Выезд на открытом воздухе на шоссе Калифорнии 85 с Джоном Болтаной и Гарри Питерсоном по поводу настройки нового выставочного зала.',
    },
  ],
}

export const pricingData: PricingType[] = [
  {
    id: '1',
    name: 'Бесплатный пакет',
    price: 0,
    features: ['5 ГБ хранилища', '100 ГБ трафика', '1 домен', 'Без поддержки', 'Поддержка 24/7', '1 пользователь'],
  },
  {
    id: '2',
    name: 'Профессиональный пакет',
    price: 19,
    features: ['50 ГБ хранилища', '900 ГБ трафика', '1 домен', 'Поддержка по email', 'Поддержка 24/7', '5 пользователей'],
    isPopular: true,
    subscribed: true,
  },
  {
    id: '3',
    name: 'Бизнес пакет',
    price: 29,
    features: ['500 ГБ хранилища', '2.5 ТБ трафика', '5 доменов', 'Поддержка по email', 'Поддержка 24/7', '10 пользователей'],
  },
  {
    id: '4',
    name: 'Корпоративный пакет',
    price: 29,
    features: ['2 ТБ хранилища', 'Неограниченный трафик', '50 доменов', 'Поддержка по email', 'Поддержка 24/7', 'Неограниченное количество пользователей'],
  },
]

export const projectsData: ProjectType[] = [
  {
    id: '1',
    projectName: 'Zelogy',
    client: 'Daniel Olsen',
    teamMembers: [avatar2, avatar3, avatar4],
    deadlineDate: new Date('12/4/2024'),
    progressValue: 33,
    variant: 'primary',
  },
  {
    id: '2',
    projectName: 'Shiaz',
    client: 'Jack Roldan',
    teamMembers: [avatar1, avatar5],
    deadlineDate: new Date('10/4/2024'),
    progressValue: 74,
    variant: 'success',
  },
  {
    id: '3',
    projectName: 'Holderick',
    client: 'Betty Cox',
    teamMembers: [avatar5, avatar2, avatar3],
    deadlineDate: new Date('31/3/2024'),
    progressValue: 50,
    variant: 'warning',
  },
  {
    id: '4',
    projectName: 'Feyvux',
    client: 'Carlos Johnson',
    teamMembers: [avatar3, avatar7, avatar6],
    deadlineDate: new Date('25/3/2024'),
    progressValue: 92,
    variant: 'primary',
  },
  {
    id: '5',
    projectName: 'Xavlox',
    client: 'Lorraine Cox',
    teamMembers: [avatar7],
    deadlineDate: new Date('22/3/2024'),
    progressValue: 48,
    variant: 'danger',
  },
  {
    id: '6',
    projectName: 'Mozacav',
    client: 'Delores Young',
    teamMembers: [avatar3, avatar4, avatar2],
    deadlineDate: new Date('15/3/2024'),
    progressValue: 21,
    variant: 'primary',
  },
]

export const transactionsData: TransactionType[] = [
  {
    id: '10101',
    customerId: '2001',
    date: new Date('04/24/2024'),
    amount: 120.55,
    description: 'Commissions',
    status: 'Cr.',
  },
  {
    id: '10102',
    customerId: '2002',
    date: new Date('12/6/2018'),
    amount: 9.68,
    description: 'Affiliates',
    status: 'Cr.',
  },
  {
    id: '10103',
    customerId: '2003',
    date: new Date('04/20/2024'),
    amount: 105.22,
    description: 'Grocery',
    status: 'Dr.',
  },
  {
    id: '10104',
    customerId: '2004',
    date: new Date('04/18/2024'),
    amount: 80.59,
    description: 'Refunds',
    status: 'Cr.',
  },
  {
    id: '10105',
    customerId: '2005',
    date: new Date('04/18/2024'),
    amount: 750.95,
    description: 'Bill Payments',
    status: 'Dr.',
  },
  {
    id: '10106',
    customerId: '2006',
    date: new Date('04/17/2024'),
    amount: 455.62,
    description: 'Electricity',
    status: 'Dr.',
  },
  {
    id: '10107',
    customerId: '2007',
    date: new Date('04/17/2024'),
    amount: 102.77,
    description: 'Interest',
    status: 'Cr.',
  },
  {
    id: '10108',
    customerId: '2008',
    date: new Date('04/16/2024'),
    amount: 79.49,
    description: 'Refunds',
    status: 'Cr.',
  },
  {
    id: '10109',
    customerId: '2009',
    date: new Date('04/05/2024'),
    amount: 980.0,
    description: 'Shopping',
    status: 'Dr.',
  },
]

export const dataTableRecords: Employee[] = [
  {
    id: '11',
    name: 'Jonathan',
    email: 'jonathan@example.com',
    position: 'Senior Implementation Architect',
    company: 'Hauck Inc',
    country: 'Holy See',
  },
  {
    id: '12',
    name: 'Harold',
    email: 'harold@example.com',
    position: 'Forward Creative Coordinator',
    company: 'Metz Inc',
    country: 'Iran',
  },
  {
    id: '13',
    name: 'Shannon',
    email: 'shannon@example.com',
    position: 'Legacy Functionality Associate',
    company: 'Zemlak Group',
    country: 'South Georgia',
  },
  {
    id: '14',
    name: 'Robert',
    email: 'robert@example.com',
    position: 'Product Accounts Technician',
    company: 'Hoeger',
    country: 'San Marino',
  },
  {
    id: '15',
    name: 'Noel',
    email: 'noel@example.com',
    position: 'Customer Data Director',
    company: 'Howell - Rippin',
    country: 'Germany',
  },
  {
    id: '16',
    name: 'Traci',
    email: 'traci@example.com',
    position: 'Corporate Identity Director',
    company: 'Koelpin - Goldner',
    country: 'Vanuatu',
  },
  {
    id: '17',
    name: 'Kerry',
    email: 'kerry@example.com',
    position: 'Lead Applications Associate',
    company: 'Feeney, Langworth and Tremblay',
    country: 'Niger',
  },
  {
    id: '18',
    name: 'Patsy',
    email: 'patsy@example.com',
    position: 'Dynamic Assurance Director',
    company: 'Streich Group',
    country: 'Niue',
  },
  {
    id: '19',
    name: 'Cathy',
    email: 'cathy@example.com',
    position: 'Customer Data Director',
    company: 'Ebert, Schamberger and Johnston',
    country: 'Mexico',
  },
  {
    id: '20',
    name: 'Tyrone',
    email: 'tyrone@example.com',
    position: 'Senior Response Liaison',
    company: 'Raynor, Rolfson and Daugherty',
    country: 'Qatar',
  },
]
