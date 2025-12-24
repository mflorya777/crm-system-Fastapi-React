import help1 from '@/assets/images/app-calendar/help-1.png'
import help2 from '@/assets/images/app-calendar/help-2.png'
import help3 from '@/assets/images/app-calendar/help-3.png'
import help4 from '@/assets/images/app-calendar/help-4.png'
import help5 from '@/assets/images/app-calendar/help-5.png'
import help6 from '@/assets/images/app-calendar/help-6.png'

export type HelpType = {
  image: string
  title: string
  description: string
}

export const helpData = [
  {
    image: help1,
    title: 'Начало работы',
    description: 'Изучите основы, подключите свой календарь и откройте для себя функции, которые упростят планирование.',
  },
  {
    image: help2,
    title: 'Доступность',
    description: 'Определите, когда вы хотели бы быть доступны, и изучите наши расширенные варианты доступности.',
  },
  {
    image: help3,
    title: 'Настройка типов событий',
    description: 'Настройте опыт для приглашенных и убедитесь, что вы собираете необходимую информацию при их бронировании.',
  },
  {
    image: help4,
    title: 'Вариант встраивания',
    description: 'Узнайте о вариантах добавления календаря на ваш веб-сайт, чтобы посетители могли запланировать встречу в момент наибольшего интереса.',
  },
  {
    image: help5,
    title: 'Командное планирование',
    description: 'Узнайте, как настроить планирование для нескольких пользователей.',
  },
  {
    image: help6,
    title: 'Интеграция',
    description: 'Подключите инструменты из вашего рабочего процесса напрямую к календарю или узнайте о том, что мы создали для упрощения планирования.',
  },
]
