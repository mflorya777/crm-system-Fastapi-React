import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import { getAllSellers } from '@/helpers/data'
import SellersList from './components/SellersList'
import type { SellerType } from '@/types/data'
import { useEffect, useState } from 'react'

const Sellers = () => {
  const [sellers, setSellers] = useState<SellerType[]>()

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllSellers()
      setSellers(data)
    }
    fetchData()
  }, [])

  return (
    <>
      <PageBreadcrumb subName="Электронная коммерция" title="Список продавцов" />
      <PageMetaData title="Продавцы" />
      {sellers && <SellersList sellers={sellers} />}
    </>
  )
}

export default Sellers
