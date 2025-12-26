import { Card, CardBody, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import LogoBox from '@/components/LogoBox'
import PageMetaData from '@/components/PageTitle'
import ThirdPartyAuth from '@/components/ThirdPartyAuth'
import SignUpForm from './components/SignUpForm'

const SignUp2 = () => {
  return (
    <>
      <PageMetaData title="Регистрация 2" />

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
            <h2 className="fw-bold text-center fs-18">Регистрация</h2>
            <p className="text-muted text-center mt-1 mb-4">Впервые на нашей платформе? Зарегистрируйтесь сейчас! Это займет всего минуту.</p>
            <div className="px-4">
              <SignUpForm />
              <ThirdPartyAuth />
            </div>
          </CardBody>
        </Card>
        <p className="text-white mb-0 text-center">
          У меня уже есть аккаунт
          <Link to="/auth/sign-in-2" className="text-white fw-bold ms-1">
            Войти
          </Link>
        </p>
      </Col>
    </>
  )
}

export default SignUp2
