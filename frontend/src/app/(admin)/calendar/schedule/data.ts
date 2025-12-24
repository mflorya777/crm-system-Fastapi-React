import { EventInput } from '@fullcalendar/core'

export const defaultEvents: EventInput[] = [
  {
    id: '1',
    title: 'Встреча с г-ном Ником',
    start: new Date(Date.now() + 158000000),
    end: new Date(Date.now() + 338000000),
    className: 'bg-warning',
  },
  {
    id: '2',
    title: 'Собеседование - Backend инженер',
    start: new Date(),
    end: new Date(),
    className: 'bg-success',
  },
  {
    id: '3',
    title: 'Телефонное собеседование - Frontend инженер',
    start: new Date(Date.now() + 168000000),
    className: 'bg-info',
  },
  {
    id: '4',
    title: 'Купить дизайн-материалы',
    start: new Date(Date.now() + 338000000),
    end: new Date(Date.now() + 338000000 * 1.2),
    className: 'bg-primary',
  },
]
