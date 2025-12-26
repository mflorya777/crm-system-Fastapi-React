import { Card, CardBody, CardTitle } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import type { OrderType } from '@/types/data'

const DeliveryInformation = ({ order }: { order: OrderType }) => {
  return (
    <Card className="card-height-100">
      <CardBody>
        <div className="float-end">
          <span role="button" className="text-primary">
            Показать все детали
          </span>
        </div>
        <CardTitle as={'h5'} className="mb-3">
          Информация о доставке
        </CardTitle>
        <div className="text-center">
          <IconifyIcon icon="bx:cart" className="h2" />
          <h5>Доставка UPS</h5>
          <p className="mb-1">
            ID заказа :
            <span className="text-muted me-2" />
            <b>#{order.id}</b>
          </p>
          <p className="mb-0">
            Способ оплаты :
            <span className="text-muted me-2" />
            <b>Наложенный платёж</b>
          </p>
        </div>
      </CardBody>
    </Card>
  )
}

export default DeliveryInformation
