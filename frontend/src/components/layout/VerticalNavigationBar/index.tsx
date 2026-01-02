import { lazy, Suspense, useMemo, useState } from 'react'

import FallbackLoading from '@/components/FallbackLoading'
import LogoBox from '@/components/LogoBox'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import AddDealCategoryModal from '@/components/deals/AddDealCategoryModal'
import { getMenuItems } from '@/helpers/menu'
import { useDealCategories } from '@/hooks/useDealCategories'
import type { MenuItemType } from '@/types/menu'
import HoverMenuToggle from './components/HoverMenuToggle'

const AppMenu = lazy(() => import('./components/AppMenu'))

const VerticalNavigationBar = () => {
  const baseMenuItems = getMenuItems()
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useDealCategories(true)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)

  // Обновляем пункт меню "Сделки" с реальными категориями
  const menuItems = useMemo(() => {
    if (categoriesLoading) {
      return baseMenuItems
    }

    return baseMenuItems.map((item) => {
      if (item.key === 'deals') {
        const categoryItems: MenuItemType[] = categories.map((category) => ({
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
      return item
    })
  }, [baseMenuItems, categories, categoriesLoading]) as MenuItemType[]

  const handleCategoryCreated = () => {
    // Принудительно обновляем список категорий после создания
    refetchCategories()
  }

  return (
    <>
      <div className="main-nav" id="leftside-menu-container">
        <LogoBox containerClassName="logo-box" squareLogo={{ className: 'logo-sm' }} textLogo={{ className: 'logo-lg' }} />

        <HoverMenuToggle />

        <SimplebarReactClient className="scrollbar">
          <Suspense fallback={<FallbackLoading />}>
            <AppMenu menuItems={menuItems} onAddCategoryClick={() => setShowAddCategoryModal(true)} />
          </Suspense>
        </SimplebarReactClient>
      </div>

      <AddDealCategoryModal
        show={showAddCategoryModal}
        onHide={() => setShowAddCategoryModal(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  )
}

export default VerticalNavigationBar
