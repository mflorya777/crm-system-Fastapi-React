import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
const ResetPassForm = () => {
  const resetPasswordSchema = yup.object({
    email: yup.string().email('Пожалуйста, введите действительный email').required('пожалуйста, введите ваш email'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  })

  return (
    <form className="authentication-form" onSubmit={handleSubmit(() => {})}>
      <TextFormInput control={control} name="email" containerClassName="mb-3" label="Email" id="email-id" placeholder="Введите ваш email" />
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit">
          Сбросить пароль
        </Button>
      </div>
    </form>
  )
}

export default ResetPassForm
