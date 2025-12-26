import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  AccordionItem,
  Card,
  CardHeader,
  CardTitle,
  Offcanvas,
  OffcanvasHeader,
  Tab,
  Tabs,
} from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import Chat from './Chat'
import Contact from './Contact'
import Group from './Group'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useChatContext } from '@/context/useChatContext'
import type { SocialUserType } from '@/types/data'

import avatar1 from '@/assets/images/users/avatar-1.jpg'

import 'swiper/css'

type ChatUsersProps = {
  onUserSelect: (value: SocialUserType) => void
  users: SocialUserType[]
  selectedUser: SocialUserType
}

const ChatLeftSidebar = ({ users, onUserSelect, selectedUser }: ChatUsersProps) => {
  const { chatSetting } = useChatContext()
  const [user, setUser] = useState<SocialUserType[]>([...users])

  const search = (text: string) => {
    setUser(text ? [...users].filter((u) => u.name!.toLowerCase().indexOf(text.toLowerCase()) >= 0) : [...users])
  }
  return (
    <Card className="position-relative overflow-hidden">
      <CardHeader className="border-0 d-flex justify-content-between align-items-center">
        <CardTitle>Чат</CardTitle>
        <span className="fs-18" role="button" onClick={chatSetting.toggle}>
          <IconifyIcon icon="bx:bx-cog" />
        </span>
      </CardHeader>
      <form className="chat-search px-3">
        <div className="chat-search-box">
          <input className="form-control" type="text" name="search" placeholder="Поиск ..." onKeyUp={(e: any) => search(e.target.value)} />
          <button type="button" className="btn btn-sm btn-link search-icon p-0">
            <IconifyIcon icon="bx:bx-search-alt" />
          </button>
        </div>
      </form>
      <Swiper
        loop
        pagination={{ el: '.swiper-pagination', clickable: true }}
        slidesPerView={6}
        spaceBetween={8}
        breakpoints={{
          0: {
            slidesPerView: 5,
          },
          1400: {
            slidesPerView: 6,
          },
        }}
        autoHeight
        className="mySwiper p-1 mx-3"
        style={{ minHeight: 45 }}>
        {users.map((user) => (
          <SwiperSlide className="avatar-sm" key={user.id}>
            <div className="chat-user-status-box">
              <span>
                <img src={user.avatar} alt="avatar-1" className="img-fluid avatar-sm rounded-circle avatar-border" />
              </span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <Tabs justify mountOnEnter variant="underline" className="nav-tabs border-top mt-2 card-tabs" defaultActiveKey={'chat-tab'}>
        <Tab title="Чат" eventKey={'chat-tab'}>
          <Chat onUserSelect={onUserSelect} users={user} selectedUser={selectedUser} />
        </Tab>
        <Tab title="Группа" eventKey={'group-tab'}>
          <Group />
        </Tab>
        <Tab title="Контакты" eventKey={'contact-tab'}>
          <Contact />
        </Tab>
      </Tabs>
      <Offcanvas
        show={chatSetting.open}
        placement="start"
        onHide={chatSetting.toggle}
        className="offcanvas-start position-absolute shadow"
        data-bs-scroll="true"
        data-bs-backdrop="false"
        tabIndex={-1}
        id="user-setting"
        aria-labelledby="user-settingLabel">
        <OffcanvasHeader closeButton>
          <h5 className="offcanvas-title text-truncate w-50" id="user-settingLabel">
            Профиль
          </h5>
        </OffcanvasHeader>
        <div className="offcanvas-body p-0 h-100" data-simplebar>
          <h4 className="page-title p-3 my-0">Настройки</h4>
          <div className="d-flex align-items-center px-3 pb-3 border-bottom">
            <img src={avatar1} className="me-2 rounded-circle" height={36} alt="avatar-1" />
            <div className="flex-grow-1">
              <div className="float-end">
                <span role="button">
                  <IconifyIcon icon="bx:qr-scan" className="fs-20" />
                </span>
              </div>
              <h5 className="my-0 fs-14">Gaston Lapierre</h5>
              <p className="mt-1 mb-0 text-muted">
                <span className="w-75">Привет! Я использую Reback Chat.</span>
              </p>
            </div>
          </div>
          <div className="px-3 my-3 app-chat-setting">
            <Accordion className="custom-accordion" id="accordionSetting">
              <AccordionItem eventKey="1" className="border-0">
                <AccordionHeader as={'h5'} className="my-0" id="headingAccount">
                  <span className="d-flex align-items-center">
                    <IconifyIcon icon="bx:key" className="me-3 fs-32" />
                    <span className="flex-grow-1">
                      <span className="fs-14 h5 mt-0 mb-1 d-block">Аккаунт</span>
                      <span className="mt-1 mb-0 text-muted w-75">Конфиденциальность, безопасность, смена номера</span>
                    </span>
                  </span>
                </AccordionHeader>

                <AccordionBody className="pb-0">
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <span role="button">
                        <IconifyIcon icon="bx:lock-alt" className="fs-18 me-2" />
                        Конфиденциальность
                      </span>
                    </li>
                    <li className="mb-2">
                      <span role="button">
                        <IconifyIcon icon="bx:check-Reback" className="fs-18 me-2" />
                        Безопасность
                      </span>
                    </li>
                    <li className="mb-2">
                      <span role="button">
                        <IconifyIcon icon="bx:badge-check" className="fs-18 me-2" />
                        Двухфакторная аутентификация
                      </span>
                    </li>
                    <li className="mb-2">
                      <span role="button">
                        <IconifyIcon icon="bx:arrow-from-left" className="fs-18 me-2" />
                        Сменить номер
                      </span>
                    </li>
                    <li className="mb-2">
                      <span role="button">
                        <IconifyIcon icon="bx:info-circle" className="fs-18 me-2" />
                        Запросить информацию об аккаунте
                      </span>
                    </li>
                    <li>
                      <span role="button">
                        <IconifyIcon icon="bx:trash" className="fs-18 me-2" />
                        Удалить мой аккаунт
                      </span>
                    </li>
                  </ul>
                </AccordionBody>
              </AccordionItem>

              <AccordionItem eventKey="2" className="border-0">
                <AccordionHeader as={'h5'} className="my-0" id="headingChats">
                  <span className="d-flex align-items-center">
                    <IconifyIcon icon="bx:message-dots" className="me-3 fs-32" />
                    <span className="flex-grow-1">
                      <span className="fs-14 h5 mt-0 mb-1 d-block">Чаты</span>
                      <span className="mt-1 mb-0 text-muted w-75">Тема, обои, история чата</span>
                    </span>
                  </span>
                </AccordionHeader>

                <AccordionBody className="pb-0">
                  <h5 className="mb-2">Отображение</h5>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2 d-flex">
                      <IconifyIcon icon="bx:palette" className="fs-18 me-2" />
                      <div className="flex-grow-1">
                        <Link to="">Тема</Link>
                        <p className="mb-0 text-muted fs-12">Системная по умолчанию</p>
                      </div>
                    </li>
                    <li className="mb-2">
                      <Link to="">
                        <IconifyIcon icon="bx:image" className="fs-16 me-2" />
                        Обои
                      </Link>
                    </li>
                  </ul>
                  <hr />
                  <h5>Настройки чата</h5>
                  <ul className="list-unstyled">
                    <li className="mb-2 ms-2">
                      <div className="float-end">
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="media" defaultChecked />
                        </div>
                      </div>
                      <Link to="">Видимость медиа</Link>
                      <p className="mb-0 text-muted fs-12">Показывать недавно загруженные медиа в галерее телефона</p>
                    </li>
                    <li className="mb-2 ms-2">
                      <div className="float-end">
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="enter" />
                        </div>
                      </div>
                      <Link to="">Enter для отправки</Link>
                      <p className="mb-0 text-muted fs-12">Клавиша Enter будет отправлять ваше сообщение</p>
                    </li>
                    <li className="mb-2 ms-2">
                      <Link to="">Размер шрифта</Link>
                      <p className="mb-0 text-muted fs-12">маленький</p>
                    </li>
                  </ul>
                  <hr />
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <div className="d-flex">
                        <IconifyIcon icon="bx:text" className="fs-16 me-2" />
                        <div className="flex-grow-1">
                          <Link to="">Язык приложения</Link>
                          <p className="mb-0 text-muted fs-12">Русский</p>
                        </div>
                      </div>
                    </li>
                    <li className="mb-2">
                      <span role="button">
                        <IconifyIcon icon="bx:cloud-upload" className="fs-16 me-2" />
                        Резервная копия чата
                      </span>
                    </li>
                    <li>
                      <span role="button">
                        <IconifyIcon icon="bx:history" className="fs-16 me-2" />
                        История чата
                      </span>
                    </li>
                  </ul>
                </AccordionBody>
              </AccordionItem>

              <AccordionItem eventKey="3" className="border-0">
                <AccordionHeader as={'h5'} className="my-0" id="headingNotification">
                  <span className="d-flex align-items-center">
                    <IconifyIcon icon="bx:bell" className="me-3 fs-32" />
                    <span className="flex-grow-1">
                      <span className="fs-14 h5 mt-0 mb-1 d-block">Уведомления</span>
                      <span className="mt-1 mb-0 text-muted w-75">Сообщения, группа, звуки звонков</span>
                    </span>
                  </span>
                </AccordionHeader>
                <AccordionBody className="pb-0">
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <div className="float-end">
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="conversation" defaultChecked />
                        </div>
                      </div>
                      <Link to="">Звуки разговора</Link>
                      <p className="mb-0 text-muted fs-12">Воспроизводить звук для входящих и исходящих сообщений.</p>
                    </li>
                  </ul>
                  <hr />
                  <h5>Сообщения</h5>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <Link to="">Звук уведомления</Link>
                      <p className="mb-0 text-muted fs-12">Мелодия по умолчанию</p>
                    </li>
                    <li className="mb-2">
                      <Link to="">Вибрация</Link>
                      <p className="mb-0 text-muted fs-12">По умолчанию</p>
                    </li>
                    <li className="mb-2">
                      <Link to="">Свет</Link>
                      <p className="mb-0 text-muted fs-12">Белый</p>
                    </li>
                  </ul>
                  <hr />
                  <h5>Группы</h5>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <Link to="">Звук уведомления</Link>
                      <p className="mb-0 text-muted fs-12">Мелодия по умолчанию</p>
                    </li>
                    <li className="mb-2">
                      <Link to="">Вибрация</Link>
                      <p className="mb-0 text-muted fs-12">Выкл</p>
                    </li>
                    <li className="mb-2">
                      <Link to="">Свет</Link>
                      <p className="mb-0 text-muted fs-12">Тёмный</p>
                    </li>
                  </ul>
                  <hr />
                  <h5>Звонки</h5>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <Link to="">Мелодия звонка</Link>
                      <p className="mb-0 text-muted fs-12">Мелодия по умолчанию</p>
                    </li>
                    <li>
                      <Link to="">Вибрация</Link>
                      <p className="mb-0 text-muted fs-12">По умолчанию</p>
                    </li>
                  </ul>
                </AccordionBody>
              </AccordionItem>

              <AccordionItem eventKey="4" className="border-0">
                <AccordionHeader as={'h5'} className="my-0" id="headingStorage">
                  <span className="d-flex align-items-center">
                    <IconifyIcon icon="bx:history" className="me-3 fs-32" />
                    <span className="flex-grow-1">
                      <span className="fs-14 h5 mt-0 mb-1 d-block">Хранилище и данные</span>
                      <span className="mt-1 mb-0 text-muted w-75">Использование сети, автоматическая загрузка</span>
                    </span>
                  </span>
                </AccordionHeader>

                <AccordionBody className="pb-0">
                  <ul className="list-unstyled mb-0">
                    <li className="d-flex">
                      <IconifyIcon icon="bx:folder" className="fs-16 me-2" />
                      <div className="flex-grow-1">
                        <Link to="">Управление хранилищем</Link>
                        <p className="mb-0 text-muted fs-12">2.4 GB</p>
                      </div>
                    </li>
                  </ul>
                  <hr />
                  <ul className="list-unstyled mb-0">
                    <li className="d-flex">
                      <IconifyIcon icon="bx:wifi" className="fs-16 me-2" />
                      <div className="flex-grow-1">
                        <Link to="">Использование сети</Link>
                        <p className="mb-0 text-muted fs-12">7.2 GB отправлено - 13.8 GB получено</p>
                      </div>
                    </li>
                  </ul>
                  <hr />
                  <h5 className="mb-0">Автоматическая загрузка медиа</h5>
                  <p className="mb-0 text-muted fs-12">Голосовые сообщения всегда загружаются автоматически</p>
                  <ul className="list-unstyled mb-0 mt-2">
                    <li className="mb-2">
                      <Link to="">При использовании мобильных данных</Link>
                      <p className="mb-0 text-muted fs-12">Без медиа</p>
                    </li>
                    <li className="mb-2 ms-2">
                      <Link to="">При подключении к Wi-Fi</Link>
                      <p className="mb-0 text-muted fs-12">Без медиа</p>
                    </li>
                    <li className="mb-2 ms-2">
                      <Link to="">В роуминге</Link>
                      <p className="mb-0 text-muted fs-12">Без медиа</p>
                    </li>
                  </ul>
                  <hr />
                  <h5 className="mb-0">Качество загрузки медиа</h5>
                  <p className="mb-0 text-muted fs-12">Выберите качество медиафайлов для отправки</p>
                  <ul className="list-unstyled mb-0 mt-2">
                    <li className="ms-2">
                      <Link to="">Качество загрузки фото</Link>
                      <p className="mb-0 text-muted fs-12">Авто (рекомендуется)</p>
                    </li>
                  </ul>
                </AccordionBody>
              </AccordionItem>

              <AccordionItem eventKey="5" className="border-0">
                <AccordionHeader as={'h5'} className="my-0" id="headingHelp">
                  <span className="d-flex align-items-center">
                    <IconifyIcon icon="bx:info-circle" className="me-3 fs-32" />
                    <span className="flex-grow-1">
                      <span className="fs-14 h5 mt-0 mb-1 d-block">Помощь</span>
                      <span className="mt-1 mb-0 text-muted w-75">Центр помощи, свяжитесь с нами, политика конфиденциальности</span>
                    </span>
                  </span>
                </AccordionHeader>

                <AccordionBody className="pb-0">
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <div role="button">
                        <IconifyIcon icon="bx:info-circle" className="fs-16 me-2" />
                        Центр помощи
                      </div>
                    </li>
                    <li className="mb-2 d-flex">
                      <IconifyIcon icon="bxs:contact" className="fs-16 me-2" />
                      <div className="flex-grow-1">
                        <Link to="">Свяжитесь с нами</Link>
                        <p className="mb-0 text-muted fs-12">Вопросы?</p>
                      </div>
                    </li>
                    <li className="mb-2">
                      <span role="button">
                        <IconifyIcon icon="bx:book-content" className="fs-16 me-2" />
                        Условия и политика конфиденциальности
                      </span>
                    </li>
                    <li>
                      <span role="button">
                        <IconifyIcon icon="bx:book-circle" className="fs-16 me-2" />
                        Информация о приложении
                      </span>
                    </li>
                  </ul>
                </AccordionBody>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Offcanvas>
    </Card>
  )
}

export default ChatLeftSidebar
