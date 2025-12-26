import { Link } from 'react-router-dom'
import * as yup from 'yup'

import PasswordFormInput from '@/components/form/PasswordFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { Button } from 'react-bootstrap'
import useSignIn from './useSignIn'

export const loginSchema = yup.object({
  email: yup.string().email('Пожалуйста, введите корректный email').required('Пожалуйста, введите ваш email'),
  password: yup.string().required('Пожалуйста, введите ваш пароль'),
})

const LoginForm = () => {
  const { loading, login, control } = useSignIn()

  return (
    <form onSubmit={login} className="authentication-form">
      <TextFormInput control={control} name="email" containerClassName="mb-3" label="Email" id="email-id" placeholder="Введите ваш email" />

      <PasswordFormInput
        control={control}
        name="password"
        containerClassName="mb-3"
        placeholder="Введите ваш пароль"
        id="password-id"
        label={
          <>
            <Link to="/auth/reset-pass" className="float-end text-muted text-unline-dashed ms-1">
              Забыли пароль?
            </Link>
            <label className="form-label" htmlFor="example-password">
              Пароль
            </label>
          </>
        }
      />

      <div className="mb-3">
        <div className="form-check">
          <input type="checkbox" className="form-check-input" id="checkbox-signin" />
          <label className="form-check-label" htmlFor="checkbox-signin">
            Запомнить меня
          </label>
        </div>
      </div>
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit" disabled={loading}>
          Войти
        </Button>
      </div>
    </form>
  )
}

export default LoginForm
