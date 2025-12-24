import { Card, CardBody, CardTitle } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import type { OrderType } from '@/types/data'

const BillingInformation = ({ order }: { order: OrderType }) => {
  return (
    <Card className="card-height-100">
      <CardBody>
        <div className="float-end">
          <span role="button" className="text-primary">
            <IconifyIcon icon="bx:edit" className="me-1" />
            Изменить
          </span>
        </div>
        <CardTitle as={'h5'} className="mb-3">
          Платёжная информация
        </CardTitle>
        <p className="mb-1">
          Тип оплаты :
          <span className="text-muted me-2" />
          <b>{order.paymentMethod}</b>
        </p>
        <p className="mb-1">
          Провайдер :
          <span className="text-muted me-2" />
          <b>Visa заканчивается на 4589</b>
        </p>
        <p className="mb-1">
          Срок действия :
          <span className="text-muted me-2" />
          <b>21/05</b>
        </p>
        <p className="mb-0">
          CVV :
          <span className="text-muted me-2" />
          <b>xxx</b>
        </p>
      </CardBody>
    </Card>
  )
}

export default BillingInformation
