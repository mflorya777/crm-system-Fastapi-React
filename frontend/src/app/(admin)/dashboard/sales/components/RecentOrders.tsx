import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardTitle, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { getAllOrders } from '@/helpers/data'
import type { OrderType } from '@/types/data'

const RecentOrders = () => {
  const [orders, setOrders] = useState<OrderType[]>()

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllOrders()
      setOrders(data)
    }
    fetchData()
  }, [])

  return (
    <Card>
      <CardBody>
        <div className="d-flex align-items-center justify-content-between">
          <CardTitle>Последние заказы</CardTitle>
          <Button variant="primary" size="sm">
            <span className="icons-center">
              <IconifyIcon icon="bx:plus" className="me-1" />
              Создать заказ
            </span>
          </Button>
        </div>
      </CardBody>
      <div className="table-responsive table-centered">
        <table className="table mb-0">
          <thead className="bg-light bg-opacity-50">
            <tr>
              <th className="border-0 py-2">ID заказа</th>
              <th className="border-0 py-2">Дата</th>
              <th className="border-0 py-2">Товар</th>
              <th className="border-0 py-2">Имя клиента</th>
              <th className="border-0 py-2">Email</th>
              <th className="border-0 py-2">Телефон</th>
              <th className="border-0 py-2">Адрес</th>
              <th className="border-0 py-2">Тип оплаты</th>
              <th className="border-0 py-2">Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders?.slice(0, 5).map((order, idx) => (
              <tr key={idx}>
                <td>
                  <Link to={`/ecommerce/orders/${order.id}`}>{order.id}</Link>
                </td>
                <td>{new Date(order.createdAt).toDateString()}</td>
                {order.product && (
                  <td>
                    <img src={order.product?.images[0]} alt="product-1(1)" className="img-fluid avatar-sm" />
                  </td>
                )}
                <td>
                  <Link to="">{order.customer?.name}</Link>
                </td>
                <td>{order.customer?.email}</td>
                <td>{order.customer?.phone}</td>
                <td>{order.customer?.address}</td>
                <td>{order.paymentMethod}</td>
                <td>
                  <div className="icons-center">
                    <IconifyIcon
                      icon="bxs:circle"
                      className={clsx(
                        'me-1',
                        order.status === 'Cancelled' ? 'text-danger' : order.status == 'Processing' ? 'text-primary' : 'text-success',
                      )}
                    />
                    {order.status}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="align-items-center justify-content-between row g-0 text-center text-sm-start p-3 border-top">
        <div className="col-sm">
          <div className="text-muted">
            Показано &nbsp;
            <span className="fw-semibold">5</span>&nbsp; из &nbsp;
            <span className="fw-semibold">90,521</span>&nbsp; заказов
          </div>
        </div>
        <Col sm="auto" className="mt-3 mt-sm-0">
          <ul className="pagination pagination-rounded m-0">
            <li className="page-item">
              <Link to="" className="page-link">
                <IconifyIcon icon="bx:left-arrow-alt" />
              </Link>
            </li>
            <li className="page-item active">
              <Link to="" className="page-link">
                1
              </Link>
            </li>
            <li className="page-item">
              <Link to="" className="page-link">
                2
              </Link>
            </li>
            <li className="page-item">
              <Link to="" className="page-link">
                3
              </Link>
            </li>
            <li className="page-item">
              <Link to="" className="page-link">
                <IconifyIcon icon="bx:right-arrow-alt" />
              </Link>
            </li>
          </ul>
        </Col>
      </div>
    </Card>
  )
}

export default RecentOrders
