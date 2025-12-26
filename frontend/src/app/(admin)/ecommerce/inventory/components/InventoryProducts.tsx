import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { getAllInventoryProducts } from '@/helpers/data'

import { Link } from 'react-router-dom'
import { Button, Card, CardBody, Col, Row } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import type { InventoryType } from '@/types/data'

const InventoryProducts = () => {
  const [inventoryProducts, setInventoryProducts] = useState<InventoryType[]>()

  useEffect(() => {
    (async () => {
      const data = await getAllInventoryProducts()
      setInventoryProducts(data)
    })()
  }, [])

  return (
    <Card>
      <CardBody>
        <Row>
          <Col xs={12}>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <Button variant="secondary">
                <IconifyIcon icon="bx:export" className="me-1 icons-center" />
                Экспорт
              </Button>
              <Button variant="secondary">
                <IconifyIcon icon="bx:import" className="me-1 icons-center" />
                Импорт
              </Button>
              <Link to="/ecommerce/products/create" className="btn btn-primary d-inline-flex align-items-center ms-md-auto">
                <IconifyIcon icon="bx:plus" className="me-1" />
                Добавить товар
              </Link>
            </div>
          </Col>
        </Row>
        <div className="table-responsive table-centered mt-3">
          <table className="table text-nowrap mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Товар</th>
                <th>Состояние</th>
                <th>Местоположение</th>
                <th>Доступно</th>
                <th>Зарезервировано</th>
                <th>На руках</th>
                <th>Изменено</th>
              </tr>
            </thead>
            <tbody>
              {inventoryProducts &&
                inventoryProducts.map((item, idx) => {
                  return (
                    <tr key={idx}>
                      <td>#{item.id}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.product && (
                            <div className="flex-shrink-0 me-3">
                              <Link to="/ecommerce/orders">
                                <img src={item.product?.images[0]} alt="product-1(1)" className="img-fluid avatar-sm" />
                              </Link>
                            </div>
                          )}
                          <div className="flex-grow-1">
                            <h5 className="mt-0 mb-1">{item.product?.name}</h5>
                            <span className="fs-13">Добавлено: {new Date(item.lastModifiedAt).toDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge badge-soft-${item.condition === 'Damaged' ? 'danger' : item.condition === 'Returned' ? 'warning' : 'success'}`}>
                          {item.condition === 'Damaged' ? 'Повреждён' : item.condition === 'Returned' ? 'Возврат' : item.condition === 'New' ? 'Новый' : item.condition}
                        </span>
                      </td>
                      <td>{item.location}</td>
                      <td>{item.quantity}</td>
                      <td>{item.reserved}</td>
                      <td>{item.onHand}</td>
                      <td>{new Date(item.lastModifiedAt).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}

export default InventoryProducts
