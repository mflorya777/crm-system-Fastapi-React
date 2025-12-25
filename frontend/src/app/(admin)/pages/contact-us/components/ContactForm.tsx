import { yupResolver } from '@hookform/resolvers/yup'
import { Button, Card, CardBody, CardHeader, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, FormCheck, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const ContactForm = () => {
  const contactFormSchema = yup.object({
    fName: yup.string().required('Пожалуйста, введите ваше имя'),
    lName: yup.string().required('Пожалуйста, введите вашу фамилию'),
    email: yup.string().email('Пожалуйста, введите корректный email').required('Пожалуйста, введите ваш email'),
    message: yup.string().required('Пожалуйста, введите ваше сообщение'),
  })

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(contactFormSchema),
  })

  return (
    <Card className="mb-0 shadow-none border-0">
      <CardHeader className="bg-light-subtle border-0">
        <h4 className="mb-0">Задайте ваши вопросы</h4>
      </CardHeader>
      <CardBody>
        <form className="authentication-form" onSubmit={handleSubmit(() => {})}>
          <Row className="mb-3">
            <TextFormInput name="fName" label="Имя" containerClassName="col-lg-6" placeholder="Имя" control={control} />
            <TextFormInput name="lName" label="Фамилия" containerClassName="col-lg-6" placeholder="Фамилия" control={control} />
          </Row>
          <TextFormInput name="email" type="email" label="Email" containerClassName="mb-3" placeholder="Введите ваш email" control={control} />
          <div className="mb-3">
            <label className="form-label" htmlFor="contactnumber">
              Номер телефона
            </label>
            <Dropdown className="form-group input-group">
              <DropdownToggle className="btn btn-light rounded-end-0 border arrow-none" type="button">
                <div className="icons-center">
                  U.S.A <IconifyIcon icon="bx:chevron-down" className="ms-2" />
                </div>
              </DropdownToggle>
              <DropdownMenu>
                <li>
                  <DropdownItem href="#">U.S.A</DropdownItem>
                </li>
                <li>
                  <DropdownItem href="#">India</DropdownItem>
                </li>
                <li>
                  <DropdownItem href="#">Iraq</DropdownItem>
                </li>
                <li>
                  <DropdownItem href="#">South Africa</DropdownItem>
                </li>
                <li>
                  <DropdownItem href="#">France</DropdownItem>
                </li>
              </DropdownMenu>
              <input type="number" className="form-control" id="contactnumber" placeholder="+0(222)000-0000" />
            </Dropdown>
          </div>
          <TextAreaFormInput name="message" label="Сообщение" control={control} rows={5} containerClassName="mb-3" placeholder="Максимум 150 слов" />
          <div className="mb-3">
            <h5 className="my-3">Услуги</h5>
            <Row>
              <Col xxl={6}>
                <FormCheck label="Дизайн веб-сайта" id="check1" className="mb-2" />
                <FormCheck label="UX дизайн" id="check2" className="mb-2" />
                <FormCheck label="Исследование пользователей" id="check3" className="mb-2" />
              </Col>
              <Col xxl={6}>
                <FormCheck label="Создание контента" id="check4" className="mb-2" />
                <FormCheck label="Стратегия и консультирование" id="check5" className="mb-2" />
                <FormCheck label="Другое" id="check6" className="mb-2" />
              </Col>
            </Row>
          </div>
          <div className="text-center d-grid">
            <Button variant="primary" type="submit">
              Отправить сообщение
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

export default ContactForm
