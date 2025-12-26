import DropzoneFormInput from '@/components/form/DropzoneFormInput'

const ProductGalleryForm = () => {
  return (
    <DropzoneFormInput
      label="Галерея товара"
      labelClassName="fs-14 mb-1"
      iconProps={{ icon: 'bx:cloud-upload', height: 36, width: 36 }}
      text="Перетащите файлы сюда или нажмите для выбора"
      helpText={
        <span className="text-muted fs-13">
          (Это демо-зона загрузки. Выбранные файлы <strong>не</strong> загружаются на самом деле.)
        </span>
      }
      showPreview
    />
  )
}

export default ProductGalleryForm
