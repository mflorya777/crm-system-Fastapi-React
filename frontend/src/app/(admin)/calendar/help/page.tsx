import { Button, Col, Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import HelpList from './components/HelpList'

const Help = () => {
  return (
    <>
      <PageBreadcrumb subName="Календарь" title="Помощь" />
      <PageMetaData title="Помощь" />

      <Row>
        <Col>
          <Row className="d-flex justify-content-center text-center mt-4 pb-5">
            <Col md={8} lg={6} xl={4}>
              <h3 className="fw-semibold">Поиск вопроса</h3>
              <p className="mb-3 text-muted">Введите ваш вопрос или ключевое слово для поиска</p>
              <div className="search-bar">
                <span>
                  <IconifyIcon icon="bx:search-alt" className="mb-1" />
                </span>
                <input type="email" className="form-control" id="search" placeholder="Начните вводить..." />
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      <HelpList />

      <Row className="mb-5">
        <Col xs={12} className="text-center">
          <h4>Не нашли ответ на вопрос?</h4>
          <Button variant="success" type="button" size="sm" className="mt-2 icons-center gap-1">
            <IconifyIcon icon="bx:envelope" className="me-1" /> Напишите нам на email
          </Button>
          <Button variant="info" type="button" size="sm" className="mt-2 ms-1 icons-center gap-1">
            <IconifyIcon icon="bxl:twitter" className="me-1" /> Напишите нам в Twitter
          </Button>
        </Col>
      </Row>
    </>
  )
}

export default Help
