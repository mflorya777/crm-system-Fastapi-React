import { yupResolver } from '@hookform/resolvers/yup'
import { Col, Row } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import ReactQuill from 'react-quill-new'
import * as yup from 'yup'

import SelectFormInput from '@/components/form/SelectFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { getAllProductCategories } from '@/helpers/data'
import type { SelectFormInputOptionType } from '@/types/component-props'
import { renameKeys } from '@/utils/rename-object-keys'

import 'react-quill-new/dist/quill.snow.css'

const generalFormSchema = yup.object({
  name: yup.string().required(),
  reference: yup.string().optional(),
  descQuill: yup.string().optional(),
  description: yup.string().required(),
  categories: yup.string().required(),
  price: yup.number().required(),
  comment: yup.string().optional(),
})

const GeneralDetailsForm = () => {
  const [productDescriptionContent, setProductDescriptionContent] = useState(`<h2>Describe Your Product...</h2>`)
  const [productCategories, setProductCategories] = useState<SelectFormInputOptionType[]>()

  const { control } = useForm({
    resolver: yupResolver(generalFormSchema),
  })

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getAllProductCategories()
      if (!data) return null
      const categoryOptions = data.map((category) => {
        return renameKeys(category, { id: 'value', name: 'label' }) as SelectFormInputOptionType
      })
      setProductCategories(categoryOptions)
    }

    fetchCategories()
  }, [])

  return (
    <form>
      <Row>
        <Col lg={6}>
          <TextFormInput
            control={control}
            label="Название товара"
            placeholder="Введите название товара"
            containerClassName="mb-3"
            id="product-name"
            name="name"
          />
        </Col>
        <Col lg={6}>
          <TextFormInput control={control} name="reference" placeholder="Введите название ссылки" label="Ссылка" containerClassName="mb-3" />
        </Col>
      </Row>
      <Row>
        <Col lg={12}>
          <div className="mb-5">
            <label className="form-label">Описание товара</label>
            <ReactQuill
              theme="snow"
              style={{ height: 195 }}
              className="pb-sm-3 pb-5 pb-xl-0"
              modules={{
                toolbar: [
                  [{ font: [] }, { size: [] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ color: [] }, { background: [] }],
                  [{ script: 'super' }, { script: 'sub' }],
                  [{ header: [false, 1, 2, 3, 4, 5, 6] }, 'blockquote', 'code-block'],
                  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
                  ['direction', { align: [] }],
                  ['link', 'image', 'video'],
                  ['clean'],
                ],
              }}
              value={productDescriptionContent}
              onChange={setProductDescriptionContent}
            />
          </div>
        </Col>
        <Col lg={6}>
          <TextAreaFormInput
            control={control}
            containerClassName="mb-3"
            label="Краткое описание товара"
            rows={5}
            id="product-summary-area"
            name="description"
          />
        </Col>
        <Col lg={6}>
          {productCategories && (
            <div className="mb-3">
              <label htmlFor="productSummary" className="form-label">
                Категории
              </label>
              <SelectFormInput className="select2" control={control} name="categories" options={productCategories} />
            </div>
          )}

          <TextFormInput control={control} name="price" label="Цена" containerClassName="mb-3" placeholder="Введите сумму" />
        </Col>
      </Row>
      <div className="mb-3">
        <label className="form-label">Статус</label>
        <br />
        <div className="form-check form-check-inline">
          <input className="form-check-input" name="radio" type="radio" id="onlineStatus" defaultValue="Online" defaultChecked />
          <label className="form-check-label" htmlFor="onlineStatus">
            Онлайн
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input className="form-check-input" name="radio" type="radio" id="offlineStatus" defaultValue="Offline" />
          <label className="form-check-label" htmlFor="offlineStatus">
            Офлайн
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input className="form-check-input" name="radio" type="radio" id="draftStatus" defaultValue="Draft" />
          <label className="form-check-label" htmlFor="draftStatus">
            Черновик
          </label>
        </div>
      </div>

      <TextAreaFormInput control={control} label="Комментарий" name="comment" containerClassName="mb-3" />
    </form>
  )
}

export default GeneralDetailsForm
