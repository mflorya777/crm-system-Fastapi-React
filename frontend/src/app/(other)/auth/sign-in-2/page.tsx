import { Card, CardBody, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import LogoBox from '@/components/LogoBox'
import PageMetaData from '@/components/PageTitle'
import ThirdPartyAuth from '@/components/ThirdPartyAuth'
import LoginForm from './components/LoginForm'

const SignIn2 = () => {
  return (
    <>
      <PageMetaData title="Вход 2" />

      <Col xl={5} className="mx-auto">
        <Card className="auth-card">
          <CardBody className="px-3 py-5">
            <LogoBox
              textLogo={{
                height: 24,
                width: 73,
              }}
              squareLogo={{ className: 'me-2' }}
              containerClassName="mx-auto mb-4 text-center auth-logo"
            />
            <h2 className="fw-bold text-center fs-18">Вход</h2>
            <p className="text-muted text-center mt-1 mb-4">Введите адрес электронной почты и пароль для доступа к панели администратора.</p>
            <div className="px-4">
              <LoginForm />
              <ThirdPartyAuth />
            </div>
          </CardBody>
        </Card>
        <p className="text-white mb-0 text-center">
          Впервые здесь?
          <Link to="/auth/sign-up-2" className="text-white fw-bold ms-1">
            Зарегистрироваться
          </Link>
        </p>
      </Col>
    </>
  )
}

export default SignIn2
