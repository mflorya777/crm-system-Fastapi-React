import { Card, CardBody, CardTitle, Table } from 'react-bootstrap'
import { currency } from '@/context/constants'
import type { OrderType } from '@/types/data'

const OrderSummery = ({ order }: { order: OrderType }) => {
  return (
    <Card>
      <CardBody>
        <CardTitle as={'h5'} className="mb-3">
          Сводка заказа #{order.id}
        </CardTitle>
        <div className="table-responsive text-nowrap table-centered">
          <Table className="mb-0">
            <thead>
              <tr>
                <th>Описание</th>
                <th>Цена</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Общая сумма :</td>
                <td>{currency}2201.59</td>
              </tr>
              <tr>
                <td>Стоимость доставки :</td>
                <td>БЕСПЛАТНО</td>
              </tr>
              <tr>
                <td>Примерный налог :</td>
                <td>{currency}15</td>
              </tr>
              <tr>
                <td className="fw-semibold">Итого :</td>
                <td className="fw-semibold">{currency}2266.59</td>
              </tr>
            </tbody>
          </Table>
        </div>
      </CardBody>
    </Card>
  )
}

export default OrderSummery
