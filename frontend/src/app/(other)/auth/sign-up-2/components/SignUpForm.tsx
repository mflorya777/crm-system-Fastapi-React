import PasswordFormInput from '@/components/form/PasswordFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, FormCheck } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const SignUpForm = () => {
  const signUpSchema = yup.object({
    name: yup.string().required('пожалуйста, введите ваше имя'),
    email: yup.string().email('Пожалуйста, введите действительный email').required('пожалуйста, введите ваш email'),
    password: yup.string().required('Пожалуйста, введите ваш пароль'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(signUpSchema),
  })
  return (
    <form onSubmit={handleSubmit(() => {})} className="authentication-form">
      <TextFormInput control={control} name="name" containerClassName="mb-3" label="Имя" id="name" placeholder="Введите ваше имя" />
      <TextFormInput control={control} name="email" containerClassName="mb-3" label="Email" id="email-id" placeholder="Введите ваш email" />
      <PasswordFormInput
        control={control}
        name="password"
        containerClassName="mb-3"
        placeholder="Введите ваш пароль"
        id="password-id"
        label="Пароль"
      />
      <div className="mb-3">
        <FormCheck label="Я принимаю Условия использования" id="termAndCondition2" />
      </div>
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit">
          Зарегистрироваться
        </Button>
      </div>
    </form>
  )
}

export default SignUpForm
