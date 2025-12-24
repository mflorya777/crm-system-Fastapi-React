import SelectFormInput from '@/components/form/SelectFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, CardBody, CardTitle, Col, Form, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const FilterProducts = () => {
  const filterProductSchema = yup.object({
    productId: yup.string().required('пожалуйста, введите ID товара'),
    condition: yup.string().required('пожалуйста, выберите состояние'),
    category: yup.string().required('пожалуйста, выберите категорию'),
    location: yup.string().required('пожалуйста, выберите местоположение'),
  })
  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(filterProductSchema),
  })
  return (
    <Form onSubmit={handleSubmit(() => {})} className="card">
      <CardBody>
        <CardTitle as="h5" className="mb-3">
          Фильтр товаров
        </CardTitle>
        <div className="search-bar mb-3">
          <span>
            <IconifyIcon icon="bx:search-alt" />
          </span>
          <input type="email" className="form-control" id="search" placeholder="Поиск по названию ......." />
        </div>
        <TextFormInput name="productId" label="ID товара" placeholder="Фильтр по ID товара" containerClassName="mb-3" control={control} />
        <SelectFormInput
          name="condition"
          label="Состояние"
          control={control}
          containerClassName="mb-3"
          options={[
            { value: 'All Conditions', label: 'Все состояния' },
            { value: 'New', label: 'Новый' },
            { value: 'Return', label: 'Возврат' },
            { value: 'Damaged', label: 'Повреждён' },
          ]}
        />
        <SelectFormInput
          name="category"
          label="Категория"
          control={control}
          containerClassName="mb-3"
          options={[
            { value: 'All Categories', label: 'Все категории' },
            { value: 'Electronics & Accessories', label: 'Электроника и аксессуары' },
            { value: 'Home & Kitchen', label: 'Дом и кухня' },
            { value: 'Cloth', label: 'Одежда' },
          ]}
        />
        <SelectFormInput
          name="location"
          label="Местоположение"
          control={control}
          containerClassName="mb-3"
          options={[
            { value: 'All Locations', label: 'Все местоположения' },
            { value: 'WareHouse 1', label: 'Склад 1' },
            { value: 'WareHouse 2', label: 'Склад 2' },
            { value: 'WareHouse 3', label: 'Склад 3' },
            { value: 'WareHouse 4', label: 'Склад 4' },
          ]}
        />
        <Row>
          <Col xs={6}>
            <Button variant="outline-primary" onClick={() => reset()} type="button" className="w-100">
              Очистить
            </Button>
          </Col>
          <Col xs={6}>
            <Button variant="primary" type="submit" className="w-100">
              Применить фильтры
            </Button>
          </Col>
        </Row>
      </CardBody>
    </Form>
  )
}

export default FilterProducts
