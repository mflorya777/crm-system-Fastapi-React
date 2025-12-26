import {
  Button,
  ButtonGroup,
  Card,
  Dropdown,
  DropdownHeader,
  DropdownMenu,
  DropdownToggle,
  OverlayTrigger,
  TabContent,
  Tooltip,
} from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useEmailContext } from '@/context/useEmailContext'
import EmailPagination from './EmailPagination'
import EmailViewOffcanvas from './EmailViewOffcanvas'
import Draft from './tabs/Draft'
import Important from './tabs/Important'
import Inbox from './tabs/Inbox'
import Sent from './tabs/Sent'
import Starred from './tabs/Starred'
import Trash from './tabs/Trash'

const EmailTopbar = () => {
  const {
    navigationBar: { toggle },
  } = useEmailContext()

  return (
    <div className="d-flex flex-wrap gap-2">
      <Button
        onClick={toggle}
        variant="light"
        className="d-xxl-none d-flex align-items-center px-2 me-2"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#EmailSidebaroffcanvas"
        aria-controls="EmailSidebaroffcanvas">
        <IconifyIcon icon="bx:menu" className="fs-18" />
      </Button>
      <ButtonGroup>
        <OverlayTrigger placement="top" overlay={<Tooltip>Архивировать</Tooltip>}>
          <Button type="button" variant="light">
            <IconifyIcon icon="bx:archive" className="fs-18" />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="top" overlay={<Tooltip>Пометить как спам</Tooltip>}>
          <Button variant="light" type="button">
            <IconifyIcon icon="bx:info-square" className="fs-18" />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="top" overlay={<Tooltip>Удалить</Tooltip>}>
          <Button variant="light" type="button">
            <IconifyIcon icon="bx:trash" className="fs-18" />
          </Button>
        </OverlayTrigger>
      </ButtonGroup>
      <OverlayTrigger placement="top" overlay={<Tooltip>Папка</Tooltip>}>
        <Dropdown as={ButtonGroup}>
          <DropdownToggle variant="light" type="button" className="arrow-none icons-center">
            <IconifyIcon icon="bx:folder" className="fs-18 me-1" />
            <IconifyIcon icon="bx:chevron-down" height={16} width={16} />
          </DropdownToggle>
          <DropdownMenu>
            <DropdownHeader>Переместить в</DropdownHeader>
            <span className="dropdown-item" role="button">
              Социальные
            </span>
            <span className="dropdown-item" role="button">
              Реклама
            </span>
            <span className="dropdown-item" role="button">
              Обновления
            </span>
            <span className="dropdown-item" role="button">
              Форумы
            </span>
          </DropdownMenu>
        </Dropdown>
      </OverlayTrigger>
      <OverlayTrigger placement="top" overlay={<Tooltip>Метки</Tooltip>}>
        <Dropdown as={ButtonGroup}>
          <DropdownToggle variant="light" className="arrow-none icons-center">
            <IconifyIcon icon="bx:bookmarks" className="fs-18 me-1" />
            <IconifyIcon icon="bx:chevron-down" height={16} width={16} />
          </DropdownToggle>
          <DropdownMenu>
            <DropdownHeader>Пометить как:</DropdownHeader>
            <span className="dropdown-item" role="button">
              Обновления
            </span>
            <span className="dropdown-item" role="button">
              Социальные
            </span>
            <span className="dropdown-item" role="button">
              Реклама
            </span>
            <span className="dropdown-item" role="button">
              Форумы
            </span>
          </DropdownMenu>
        </Dropdown>
      </OverlayTrigger>
      <OverlayTrigger placement="top" overlay={<Tooltip>Дополнительные действия</Tooltip>}>
        <Dropdown as={ButtonGroup}>
          <DropdownToggle variant="light" className="arrow-none icons-center">
            Ещё
            <IconifyIcon icon="bx:chevron-down" height={16} width={16} className="ms-1" />
          </DropdownToggle>
          <DropdownMenu>
            <DropdownHeader>Дополнительные опции:</DropdownHeader>
            <span className="dropdown-item" role="button">
              Отметить как непрочитанное
            </span>
            <span className="dropdown-item" role="button">
              Добавить в задачи
            </span>
            <span className="dropdown-item" role="button">
              Добавить звезду
            </span>
            <span className="dropdown-item" role="button">
              Отключить уведомления
            </span>
          </DropdownMenu>
        </Dropdown>
      </OverlayTrigger>
    </div>
  )
}

const EmailTabList = () => {
  return (
    <Card className="position-relative overflow-hidden h-100">
      <div className="p-3">
        <EmailTopbar />
      </div>

      <TabContent className="pt-0">
        <Inbox />

        <Starred />

        <Draft />

        <Sent />

        <Trash />

        <Important />
      </TabContent>

      <EmailPagination />

      <EmailViewOffcanvas />
    </Card>
  )
}

export default EmailTabList
