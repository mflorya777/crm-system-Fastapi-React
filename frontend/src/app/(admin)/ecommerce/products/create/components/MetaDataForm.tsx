import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { Col, Row } from 'react-bootstrap'

const metaDataFormSchema = yup.object({
  title: yup.string().required(),
  keywords: yup.string().required(),
  description: yup.string().required(),
})

const MetaDataForm = () => {
  const { control } = useForm({
    resolver: yupResolver(metaDataFormSchema),
  })

  return (
    <form>
      <h5 className="mb-3 mt-0">Заполните всю информацию ниже</h5>
      <Row>
        <Col md={6}>
          <TextFormInput control={control} name="title" containerClassName="mb-3" label="Мета заголовок" placeholder="Введите мета заголовок" />
        </Col>
        <Col md={6}>
          <TextFormInput control={control} name="title" containerClassName="mb-3" label="Мета ключевые слова" placeholder="Введите мета ключевые слова" />
        </Col>
      </Row>

      <TextAreaFormInput
        control={control}
        name="description"
        label="Мета описание"
        containerClassName="mb-3"
        placeholder="Введите мета описание"
      />
    </form>
  )
}

export default MetaDataForm
