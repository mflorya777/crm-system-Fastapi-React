import { Button } from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'

const SidePanel = ({ createNewEvent }: { createNewEvent: () => void }) => {
  // external events
  const externalEvents = [
    {
      id: 1,
      variant: 'primary',
      title: 'Встреча по тимбилдингу',
    },
    {
      id: 2,
      variant: 'info',
      title: 'Стратегическая встреча по запуску продукта',
    },
    {
      id: 3,
      variant: 'success',
      title: 'Ежемесячный обзор продаж',
    },
    {
      id: 4,
      variant: 'danger',
      title: 'Праздничный обед команды',
    },
    {
      id: 5,
      variant: 'warning',
      title: 'Запуск маркетинговой кампании',
    },
  ]

  return (
    <>
      <div className="d-grid">
        <Button variant="primary" type="button" onClick={createNewEvent}>
          <IconifyIcon icon="bx:plus" className="fs-18 me-2" />
          Добавить новое событие
        </Button>
      </div>
      <div id="external-events">
        <br />
        <p className="text-muted">Перетащите событие или нажмите в календаре</p>

        {externalEvents.map(({ id, variant, title }) => (
          <div key={id} className={`external-event pb-1 bg-soft-${variant} text-${variant}`} title={title} data-class={`bg-${variant}`}>
            <span className="icons-center">
              <IconifyIcon icon="bxs:circle" className="me-2 vertical-middle" />
              {title}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

export default SidePanel
