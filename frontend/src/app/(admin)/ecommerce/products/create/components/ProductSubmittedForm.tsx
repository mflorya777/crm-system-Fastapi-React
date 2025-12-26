import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Col, Row } from 'react-bootstrap'

const ProductSubmittedForm = () => {
  return (
    <Row className="d-flex justify-content-center">
      <Col lg={6}>
        <div className="text-center">
          <IconifyIcon icon={'bx:check-double'} className="text-success h2" />
          <h3 className="mt-0">Поздравляем!</h3>
          <h5 className="w-75 mb-2 mt-3 mx-auto text-muted">Ваш товар успешно добавлен!</h5>
        </div>
      </Col>
    </Row>
  )
}

export default ProductSubmittedForm
