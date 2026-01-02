import { lazy, Suspense, useMemo, useState } from 'react'

import FallbackLoading from '@/components/FallbackLoading'
import LogoBox from '@/components/LogoBox'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import AddDealCategoryModal from '@/components/deals/AddDealCategoryModal'
import AddBuyerCategoryModal from '@/components/buyers/AddBuyerCategoryModal'
import { getMenuItems } from '@/helpers/menu'
import { useDealCategories } from '@/hooks/useDealCategories'
import { useBuyerCategories } from '@/hooks/useBuyerCategories'
import type { MenuItemType } from '@/types/menu'
import HoverMenuToggle from './components/HoverMenuToggle'

const AppMenu = lazy(() => import('./components/AppMenu'))

const VerticalNavigationBar = () => {
  const baseMenuItems = getMenuItems()
  const { categories: dealCategories, loading: dealCategoriesLoading, refetch: refetchDealCategories } = useDealCategories(true)
  const { categories: buyerCategories, loading: buyerCategoriesLoading, refetch: refetchBuyerCategories } = useBuyerCategories(true)
  const [showAddDealCategoryModal, setShowAddDealCategoryModal] = useState(false)
  const [showAddBuyerCategoryModal, setShowAddBuyerCategoryModal] = useState(false)

  // Обновляем пункты меню "Сделки" и "Покупатели" с реальными категориями
  const menuItems = useMemo(() => {
    if (dealCategoriesLoading || buyerCategoriesLoading) {
      return baseMenuItems
    }

    return baseMenuItems.map((item) => {
      if (item.key === 'deals') {
        const categoryItems: MenuItemType[] = dealCategories.map((category) => ({
          key: `deals-category-${category.id}`,
          label: category.name,
          url: `/deals/category/${category.id}`,
          parentKey: 'deals',
        }))

        // Добавляем пункт "Добавить категорию +" в конец списка
        categoryItems.push({
          key: 'deals-add-category',
          label: 'Добавить категорию +',
          url: '#', // Специальный URL для обработки клика
          parentKey: 'deals',
        })

        return {
          ...item,
          children: categoryItems,
        }
      }
      
      if (item.key === 'buyers') {
        const categoryItems: MenuItemType[] = buyerCategories.map((category) => ({
          key: `buyers-category-${category.id}`,
          label: category.name,
          url: `/buyers/category/${category.id}`,
          parentKey: 'buyers',
        }))

        // Добавляем пункт "Добавить категорию +" в конец списка
        categoryItems.push({
          key: 'buyers-add-category',
          label: 'Добавить категорию +',
          url: '#', // Специальный URL для обработки клика
          parentKey: 'buyers',
        })

        return {
          ...item,
          children: categoryItems,
        }
      }
      
      return item
    })
  }, [baseMenuItems, dealCategories, buyerCategories, dealCategoriesLoading, buyerCategoriesLoading]) as MenuItemType[]

  const handleDealCategoryCreated = () => {
    // Принудительно обновляем список категорий после создания
    refetchDealCategories()
  }

  const handleBuyerCategoryCreated = () => {
    // Принудительно обновляем список категорий после создания
    refetchBuyerCategories()
  }

  const handleAddCategoryClick = (menuKey: string) => {
    if (menuKey === 'deals-add-category') {
      setShowAddDealCategoryModal(true)
    } else if (menuKey === 'buyers-add-category') {
      setShowAddBuyerCategoryModal(true)
    }
  }

  return (
    <>
      <div className="main-nav" id="leftside-menu-container">
        <LogoBox containerClassName="logo-box" squareLogo={{ className: 'logo-sm' }} textLogo={{ className: 'logo-lg' }} />

        <HoverMenuToggle />

        <SimplebarReactClient className="scrollbar">
          <Suspense fallback={<FallbackLoading />}>
            <AppMenu menuItems={menuItems} onAddCategoryClick={handleAddCategoryClick} />
          </Suspense>
        </SimplebarReactClient>
      </div>

      <AddDealCategoryModal
        show={showAddDealCategoryModal}
        onHide={() => setShowAddDealCategoryModal(false)}
        onCategoryCreated={handleDealCategoryCreated}
      />
      
      <AddBuyerCategoryModal
        show={showAddBuyerCategoryModal}
        onHide={() => setShowAddBuyerCategoryModal(false)}
        onCategoryCreated={handleBuyerCategoryCreated}
      />
    </>
  )
}

export default VerticalNavigationBar
