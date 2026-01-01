import PasswordFormInput from '@/components/form/PasswordFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { Button, FormCheck } from 'react-bootstrap'
import useSignUp from '../../sign-up/useSignUp'

const SignUpForm = () => {
  const { loading, register, control } = useSignUp()

  return (
    <form onSubmit={register} className="authentication-form">
      <TextFormInput control={control} name="name" containerClassName="mb-3" label="Имя" id="name" placeholder="Введите ваше имя" />
      <TextFormInput control={control} name="soname" containerClassName="mb-3" label="Фамилия" id="soname" placeholder="Введите вашу фамилию" />
      <TextFormInput control={control} name="father_name" containerClassName="mb-3" label="Отчество" id="father_name" placeholder="Введите ваше отчество" />
      <TextFormInput control={control} name="phone" containerClassName="mb-3" label="Номер телефона" id="phone" placeholder="+7 (xxx) xxx-xx-xx" />
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
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
      </div>
    </form>
  )
}

export default SignUpForm
