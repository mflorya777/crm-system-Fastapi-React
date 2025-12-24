import clsx from 'clsx'
import { Button, Card, CardBody, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { getAllOrders } from '@/helpers/data'
import type { OrderType } from '@/types/data'
import { useEffect, useState } from 'react'

const Orders = () => {
  const [orders, setOrders] = useState<OrderType[]>()

  useEffect(() => {
    (async () => {
      const data = await getAllOrders()
      setOrders(data)
    })()
  }, [])

  return (
    <>
      <PageBreadcrumb subName="Электронная коммерция" title="Список заказов" />
      <PageMetaData title="Список заказов" />

      <Row>
        <Col>
          <Card>
            <CardBody>
              <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
                <div className="search-bar">
                  <span>
                    <IconifyIcon icon="bx:search-alt" />
                  </span>
                  <input type="search" className="form-control" id="search" placeholder="Поиск ..." />
                </div>
                <div className="d-flex flex-wrap gap-2 justify-content-end">
                  <Dropdown>
                    <DropdownToggle as={'a'} role="button" className="arrow-none btn btn-light dropdown-toggle">
                      <div className="flex-centered mb-0">
                        <IconifyIcon icon="bx:sort" className="me-1" />
                        Фильтр <IconifyIcon icon="bx:chevron-down" height={16} width={16} className="ms-2" />
                      </div>
                    </DropdownToggle>
                    <DropdownMenu className="dropdown-menu-end">
                      <DropdownItem href="">По дате</DropdownItem>
                      <DropdownItem href="">По ID заказа</DropdownItem>
                      <DropdownItem href="">По статусу</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                  <Button variant="primary">
                    <IconifyIcon icon="bx:plus" className="me-1" />
                    Создать контакт
                  </Button>
                </div>
              </div>
            </CardBody>
            <div className="table-responsive table-centered">
              <table className="table text-nowrap mb-0">
                <thead className="bg-light bg-opacity-50">
                  <tr>
                    <th>ID заказа</th>
                    <th>Дата</th>
                    <th>Товар</th>
                    <th>Имя клиента</th>
                    <th>Email</th>
                    <th>Телефон</th>
                    <th>Адрес</th>
                    <th>Тип оплаты</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {orders &&
                    orders.map((order, idx) => {
                      return (
                        <tr key={idx}>
                          <td>
                            <Link to={`/ecommerce/orders/${order.id}`}>{order.id}</Link>
                          </td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
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
                      )
                    })}
                </tbody>
              </table>
            </div>
            <div className="align-items-center justify-content-between row g-0 text-center text-sm-start p-3 border-top">
              <div className="col-sm">
                <div className="text-muted">
                  Показано&nbsp;
                  <span className="fw-semibold">10</span>&nbsp; из &nbsp;
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
        </Col>
      </Row>
    </>
  )
}

export default Orders
