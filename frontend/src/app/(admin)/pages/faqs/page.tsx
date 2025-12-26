import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Button, Card, CardBody, Col, Row } from 'react-bootstrap'

import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { faqData } from './data'

const GeneralFaq = () => {
  return (
    <>
      <h4 className="mb-3 fw-semibold fs-16">Общие</h4>
      <Accordion alwaysOpen defaultActiveKey={'0'}>
        {faqData.General.map((faq, idx) => (
          <AccordionItem eventKey={`${idx}`} key={idx}>
            <AccordionHeader>
              <div className="fw-medium">{faq.question}</div>
            </AccordionHeader>
            <AccordionBody>{faq.answer}</AccordionBody>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  )
}

const RefundFaqs = () => {
  return (
    <>
      <h4 className="mb-3 mt-4 fw-semibold fs-16">Возвраты</h4>
      <Accordion alwaysOpen defaultActiveKey={'0'}>
        {faqData.Refunds.map((faq, idx) => (
          <AccordionItem eventKey={`${idx}`} key={idx}>
            <AccordionHeader>
              <div className="fw-medium">{faq.question}</div>
            </AccordionHeader>
            <AccordionBody>{faq.answer}</AccordionBody>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  )
}

const PaymentsFaqs = () => {
  return (
    <>
      <h4 className="mb-3 fw-semibold fs-16">Платежи</h4>
      <Accordion alwaysOpen defaultActiveKey={'0'}>
        {faqData.Payments.map((faq, idx) => (
          <AccordionItem eventKey={`${idx}`} key={idx}>
            <AccordionHeader>
              <div className="fw-medium">{faq.question}</div>
            </AccordionHeader>
            <AccordionBody>{faq.answer}</AccordionBody>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  )
}

const SupportFaqs = () => {
  return (
    <>
      <h4 className="mb-3 mt-4 fw-semibold fs-16">Поддержка</h4>
      <Accordion alwaysOpen defaultActiveKey={'0'}>
        {faqData.Support.map((faq, idx) => (
          <AccordionItem eventKey={`${idx}`} key={idx}>
            <AccordionHeader>
              <div className="fw-medium">{faq.question}</div>
            </AccordionHeader>
            <AccordionBody>{faq.answer}</AccordionBody>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  )
}

const FAQs = () => {
  return (
    <>
      <PageBreadcrumb subName="Страницы" title="Часто задаваемые вопросы" />
      <PageMetaData title="Часто задаваемые вопросы" />

      <Row>
        <Col>
          <Card>
            <CardBody className="p-4">
              <Row className="g-xl-4">
                <Col xl={6}>
                  <GeneralFaq />
                  <RefundFaqs />
                </Col>
                <Col xl={6}>
                  <PaymentsFaqs />
                  <SupportFaqs />
                </Col>
              </Row>
              <Row className="my-5">
                <Col xs={12} className="text-center">
                  <h4>Не нашли ответ на вопрос?</h4>
                  <div className="icons-center gap-1">
                    <Button variant="success" type="button" className="mt-2">
                      <IconifyIcon icon="bx:envelope" className="me-2" />
                      Напишите нам на email
                    </Button>
                    <Button variant="info" type="button" className="mt-2 ms-1">
                      <IconifyIcon icon="bxl:twitter" className="me-2" />
                      Напишите нам в Twitter
                    </Button>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default FAQs
