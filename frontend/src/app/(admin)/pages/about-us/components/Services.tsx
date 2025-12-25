import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardTitle, Col, Row } from 'react-bootstrap'

const Services = () => {
  return (
    <Card>
      <CardBody className="p-4">
        <CardTitle className="fw-bold text-uppercase mb-2">Наши услуги</CardTitle>
        <p className="mb-4">
          Наша работа является свидетельством преданности, инноваций и совершенства. С тщательным вниманием к деталям и страстью к превосходству ожиданий, мы стремимся предоставлять решения, которые вдохновляют и расширяют возможности.
        </p>
        <Row>
          <Col md={4}>
            <div className="d-flex flex-wrap flex-md-nowrap gap-2 p-3 mb-3">
              <div className="flex-shrink-0 avatar-sm">
                <div className="avatar-title bg-primary bg-gradient text-white rounded-circle">
                  <IconifyIcon icon="bxl:react" className="fs-20" />
                </div>
              </div>
              <div className="flex-grow-1 d-flex flex-grow-1 flex-column">
                <h5 className="fs-16 fw-semibold lh-base">
                  <Link to="" className="text-reset">
                    Creative React Bootstrap Admin
                  </Link>
                </h5>
                <span className="flex-grow-1 text-muted">
                  Представляем наш Creative React Bootstrap Admin - динамичное решение, объединяющее универсальность с элегантным дизайном. Откройте для себя бесшовное управление и интуитивный пользовательский опыт с нашим инновационным набором инструментов.
                </span>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="d-flex flex-wrap flex-md-nowrap gap-2 p-3 mb-3">
              <div className="flex-shrink-0 avatar-sm">
                <div className="avatar-title bg-purple bg-gradient text-white rounded-circle">
                  <IconifyIcon icon="bxl:bootstrap" className="fs-20" />
                </div>
              </div>
              <div className="flex-grow-1 d-flex flex-grow-1 flex-column">
                <h5 className="fs-16 fw-semibold lh-base">
                  <Link to="">Bootstrap SaaS Admin</Link>
                </h5>
                <span className="flex-grow-1 text-muted">
                  Представляем наш Bootstrap SaaS Admin - передовую платформу, созданную для оптимизированного управления. Используйте мощь надежного фреймворка Bootstrap, обогащенного возможностями SaaS для масштабируемых решений.
                </span>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="d-flex flex-wrap flex-md-nowrap gap-2 p-3 mb-3">
              <div className="flex-shrink-0 avatar-sm">
                <div className="avatar-title bg-cyan bg-gradient text-white rounded-circle">
                  <IconifyIcon icon="bxl:vuejs" className="fs-20" />
                </div>
              </div>
              <div className="flex-grow-1 d-flex flex-grow-1 flex-column">
                <h5 className="fs-16 fw-semibold lh-base">
                  <Link to="">VueJS Client Project</Link>
                </h5>
                <span className="flex-grow-1 text-muted">
                  Представляем наш VueJS Client Project - динамичное и отзывчивое веб-приложение на базе Vue.js. Бесшовно сочетая функциональность с элегантностью, этот проект обеспечивает захватывающий пользовательский опыт.
                </span>
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <div className="d-flex flex-wrap flex-md-nowrap gap-2 p-3 mb-3">
              <div className="flex-shrink-0 avatar-sm">
                <div className="avatar-title bg-danger bg-gradient text-white rounded-circle">
                  <IconifyIcon icon="bxl:html5" className="fs-20" />
                </div>
              </div>
              <div className="flex-grow-1 d-flex flex-grow-1 flex-column">
                <h5 className="fs-16 fw-semibold lh-base">
                  <Link to="">Pure HTML CSS Landing</Link>
                </h5>
                <span className="flex-grow-1 text-muted">
                  Представляем наш Pure HTML CSS Landing - минималистичное, но эффективное решение для лендинга. Созданное с точностью с использованием HTML и CSS, оно воплощает простоту и элегантность.
                </span>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="d-flex flex-wrap flex-md-nowrap gap-2 p-3 mb-3">
              <div className="flex-shrink-0 avatar-sm">
                <div className="avatar-title bg-green bg-gradient text-white rounded-circle">
                  <IconifyIcon icon="bxl:nodejs" className="fs-20" />
                </div>
              </div>
              <div className="flex-grow-1 d-flex flex-grow-1 flex-column">
                <h5 className="fs-16 fw-semibold lh-base">
                  <Link to="">Node.js Backend Project</Link>
                </h5>
                <span className="flex-grow-1 text-muted">
                  Представляем наш Node.js Backend Project - надежное и масштабируемое решение для питания ваших приложений. Используя мощь Node.js, мы предоставляем эффективные и высокопроизводительные backend-системы.
                </span>
              </div>
            </div>
          </Col>
        </Row>
        <div className="mt-3 text-center">
          <span role="button" className="text-primary">
            <IconifyIcon icon="bx:loader-circle" className="spin-icon fs-22 align-middle me-1" />
            Загрузка
          </span>
        </div>
      </CardBody>
    </Card>
  )
}

export default Services
