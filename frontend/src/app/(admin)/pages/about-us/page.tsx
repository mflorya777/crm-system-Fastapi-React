import { Col, Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import About from './components/About'
import Services from './components/Services'
import Team from './components/Team'
import PageMetaData from '@/components/PageTitle'

const AboutUs = () => {
  return (
    <>
      <PageBreadcrumb subName="Страницы" title="О нас" />
      <PageMetaData title="О нас" />

      <Row>
        <Col xs={12}>
          <About />
          <Services />
          <Team />
        </Col>
      </Row>
    </>
  )
}

export default AboutUs
