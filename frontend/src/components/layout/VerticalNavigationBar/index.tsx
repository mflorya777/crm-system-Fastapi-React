import { lazy, Suspense, useMemo } from 'react'

import FallbackLoading from '@/components/FallbackLoading'
import LogoBox from '@/components/LogoBox'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import { getMenuItems } from '@/helpers/menu'
import { useDealCategories } from '@/hooks/useDealCategories'
import type { MenuItemType } from '@/types/menu'
import HoverMenuToggle from './components/HoverMenuToggle'

const AppMenu = lazy(() => import('./components/AppMenu'))

const VerticalNavigationBar = () => {
  const baseMenuItems = getMenuItems()
  const { categories, loading: categoriesLoading } = useDealCategories(true)

  // Обновляем пункт меню "Сделки" с реальными категориями
  const menuItems = useMemo(() => {
    if (categoriesLoading) {
      return baseMenuItems
    }

    return baseMenuItems.map((item) => {
      if (item.key === 'deals') {
        return {
          ...item,
          children: categories.map((category) => ({
            key: `deals-category-${category.id}`,
            label: category.name,
            url: `/deals/category/${category.id}`,
            parentKey: 'deals',
          })),
        }
      }
      return item
    })
  }, [baseMenuItems, categories, categoriesLoading]) as MenuItemType[]

  return (
    <div className="main-nav" id="leftside-menu-container">
      <LogoBox containerClassName="logo-box" squareLogo={{ className: 'logo-sm' }} textLogo={{ className: 'logo-lg' }} />

      <HoverMenuToggle />

      <SimplebarReactClient className="scrollbar">
        <Suspense fallback={<FallbackLoading />}>
          <AppMenu menuItems={menuItems} />
        </Suspense>
      </SimplebarReactClient>
    </div>
  )
}

export default VerticalNavigationBar
