import { Card, CardBody, Col, Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import CreateProductForms from './components/CreateProductForms'
import PageMetaData from '@/components/PageTitle'

const CreateProduct = () => {
  return (
    <>
      <PageBreadcrumb title="Создать товар" subName="Электронная коммерция" />
      <PageMetaData title="Создать товар" />

      <Row>
        <Col>
          <Card>
            <CardBody>
              <CreateProductForms />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default CreateProduct
