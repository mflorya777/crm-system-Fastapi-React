import { Card, CardBody, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import LogoBox from '@/components/LogoBox'
import PageMetaData from '@/components/PageTitle'
import ResetPassForm from './components/ResetPassForm'

const ResetPassword2 = () => {
  return (
    <>
      <PageMetaData title="Сброс пароля 2" />

      <Col xl={5} className="mx-auto">
        <Card className="auth-card">
          <CardBody className="px-3 py-5">
            <LogoBox
              textLogo={{
                height: 24,
                width: 73,
              }}
              squareLogo={{ className: 'me-1' }}
              containerClassName="mx-auto mb-4 text-center auth-logo"
            />
            <h2 className="fw-bold text-center fs-18">Сброс пароля</h2>
            <p className="text-muted text-center mt-1 mb-4">
              Введите ваш адрес электронной почты, и мы отправим вам письмо с инструкциями по сбросу пароля.
            </p>
            <div className="px-4">
              <ResetPassForm />
            </div>
          </CardBody>
        </Card>
        <p className="text-white mb-0 text-center">
          Вернуться к
          <Link to="/auth/sign-in" className="text-white fw-bold ms-1">
            Входу
          </Link>
        </p>
      </Col>
    </>
  )
}

export default ResetPassword2
