import googleMail from '@/assets/images/app-calendar/google-mail.png'
import googleAnalytics from '@/assets/images/app-calendar/google-analytics.png'
import googleMeet from '@/assets/images/app-calendar/google-meet.png'
import googleIntercom from '@/assets/images/app-calendar/intercom.png'
import microsoftOutlook from '@/assets/images/app-calendar/microsoft-outlook.png'
import googleChrome from '@/assets/images/app-calendar/google-chrome.png'
import hubSpot from '@/assets/images/app-calendar/hubspot.png'
import stripe from '@/assets/images/app-calendar/stripe.png'
import slack from '@/assets/images/app-calendar/slack.png'
import salesForce from '@/assets/images/app-calendar/sales-force.png'
import webHooks from '@/assets/images/app-calendar/web-hooks.png'
import facebook from '@/assets/images/app-calendar/facebook.png'
import teamConference from '@/assets/images/app-calendar/microsoft-team-conference.png'
import zapier from '@/assets/images/app-calendar/zapier.png'
import zoom from '@/assets/images/app-calendar/zoom.png'

export type IntegrationType = {
  name: string
  image: string
  description: string
  enable: boolean
}

export const IntegrationData: IntegrationType[] = [
  {
    name: 'Google Mail',
    image: googleMail,
    description: 'Вы можете нажать на предстоящую встречу, чтобы увидеть детали и присоединиться к звонку.',
    enable: true,
  },
  {
    name: 'Google Analytics',
    image: googleAnalytics,
    description: 'Вы можете измерить ROI вашей рекламы, а также отслеживать видео, приложения и социальные сети.',
    enable: false,
  },
  {
    name: 'Google Meet',
    image: googleMeet,
    description: 'Это одно из двух приложений, которые заменяют Google Hangouts и Google Chat.',
    enable: true,
  },
  {
    name: 'Intercom',
    image: googleIntercom,
    description: 'Это полноценная платформа для обмена сообщениями с клиентами на протяжении всего жизненного цикла.',
    enable: false,
  },
  {
    name: 'Microsoft Outlook',
    image: microsoftOutlook,
    description: 'Запланируйте онлайн-встречу, используя Outlook. Откройте Outlook и перейдите в календарь.',
    enable: true,
  },
  {
    name: 'Google Chrome',
    image: googleChrome,
    description: 'Используя браузер, делитесь видео, рабочим столом и презентациями с коллегами и клиентами.',
    enable: true,
  },
  {
    name: 'HubSpot',
    image: hubSpot,
    description: 'Дайте потенциальным клиентам возможность записаться на встречу с вами и сэкономьте часы времени на ненужной переписке.',
    enable: true,
  },
  {
    name: 'Stripe',
    image: stripe,
    description: 'Sessions — это бесплатная конференция для лидеров в области платежей, разработчиков, основателей и любознательных наблюдателей.',
    enable: false,
  },
  {
    name: 'Slack',
    image: slack,
    description: 'Это центр сотрудничества, который объединяет нужных людей, информацию и инструменты для выполнения работы.',
    enable: false,
  },
  {
    name: 'Salesforce',
    image: salesForce,
    description: 'Он предоставляет интерфейс, который дает продавцам полезные данные, хранящиеся в Salesforce, для проведения эффективных звонков.',
    enable: true,
  },
  {
    name: 'Web Hooks',
    image: webHooks,
    description: 'Webhooks как средство уведомления сторонних приложений (потребительских приложений) о событиях, происходящих в аккаунте Zoom.',
    enable: false,
  },
  {
    name: 'Facebook',
    image: facebook,
    description: 'Messenger Rooms позволяет создать видеовстречу и пригласить друзей присоединиться, даже если эти люди не являются пользователями Facebook.',
    enable: true,
  },
  {
    name: 'Microsoft Team Conference',
    image: teamConference,
    description: 'Он автоматически включает конференц-связь Microsoft Teams. Встречи в Teams включают аудио, видео и совместное использование экрана.',
    enable: false,
  },
  {
    name: 'Zapier',
    image: zapier,
    description: 'Zapier позволяет подключить Google Meet к тысячам самых популярных приложений, чтобы вы могли автоматизировать свою работу и иметь больше времени.',
    enable: true,
  },
  {
    name: 'Zoom',
    image: zoom,
    description: 'Zoom Cloud Meetings — это проприетарная программа для видеоконференций, разработанная Zoom Video Communications.',
    enable: false,
  },
]
